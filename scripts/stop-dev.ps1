param(
  [int]$Port = 3000,
  [switch]$KeepDb
)

$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $root

function Stop-ProcessTree {
  param([int]$ProcessId)

  $children = Get-CimInstance Win32_Process -Filter "ParentProcessId = $ProcessId" -ErrorAction SilentlyContinue
  foreach ($child in $children) {
    Stop-ProcessTree -ProcessId ([int]$child.ProcessId)
  }

  $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
  if ($process) {
    if ($process.ProcessName -eq 'conhost') {
      return
    }

    Write-Host "Stopping process $ProcessId ($($process.ProcessName))..."
    Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
  }
}

function Stop-PortListeners {
  param([int]$TargetPort)

  $listeners = Get-NetTCPConnection -LocalPort $TargetPort -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique

  if (-not $listeners) {
    Write-Host "No process is listening on port $TargetPort."
    return
  }

  foreach ($processId in $listeners) {
    if ($processId -and $processId -ne 0) {
      Stop-ProcessTree -ProcessId ([int]$processId)
    }
  }
}

Stop-PortListeners -TargetPort $Port

if (-not $KeepDb) {
  $infoJson = & node (Join-Path $PSScriptRoot 'db-url-info.mjs')
  if ($LASTEXITCODE -ne 0) {
    Write-Host 'Could not inspect DATABASE_URL; skipped database stop.'
    exit 0
  }

  $info = $infoJson | ConvertFrom-Json
  if (-not $info.isLocalSupabase) {
    Write-Host 'Hosted database detected; skipped database stop.'
    exit 0
  }

  $supabase = Get-Command supabase -ErrorAction SilentlyContinue
  if ($supabase) {
    Write-Host 'Stopping local Supabase...'
    supabase stop
  } else {
    Write-Host 'Supabase CLI not found; skipped database stop.'
  }
}
