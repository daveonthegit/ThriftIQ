param(
  [int]$Port = 3000,
  [switch]$SkipDb,
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

  $stoppedCount = 0
  $listeners = Get-NetTCPConnection -LocalPort $TargetPort -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique

  foreach ($processId in $listeners) {
    if ($processId -and $processId -ne 0) {
      Stop-ProcessTree -ProcessId ([int]$processId)
      $stoppedCount += 1
    }
  }

  return $stoppedCount
}

function Ensure-LocalEnvironment {
  $envLocal = Join-Path $root '.env.local'
  $envExample = Join-Path $root '.env.example'

  if (-not (Test-Path $envLocal) -and (Test-Path $envExample)) {
    Copy-Item -LiteralPath $envExample -Destination $envLocal
    Write-Host 'Created .env.local from .env.example.'
  }
}

function Ensure-Dependencies {
  $nextBin = Join-Path $root 'node_modules\.bin\next.cmd'
  if (-not (Test-Path $nextBin)) {
    Write-Host 'Dependencies are missing. Running npm install...'
    npm install
  }
}

function Set-ResolvedEnvironment {
  $json = & node (Join-Path $PSScriptRoot 'env-resolve.mjs')
  if ($LASTEXITCODE -ne 0) {
    throw 'Could not resolve local environment.'
  }

  $resolved = $json | ConvertFrom-Json
  $env:DATABASE_URL = $resolved.databaseUrl
  $env:THRIFTIQ_DATABASE_URL_SOURCE = $resolved.databaseUrlSource

  if ($resolved.supabasePublicKey) {
    $env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = $resolved.supabasePublicKey
    $env:NEXT_PUBLIC_SUPABASE_ANON_KEY = $resolved.supabasePublicKey
    $env:THRIFTIQ_SUPABASE_PUBLIC_KEY_SOURCE = $resolved.supabasePublicKeySource
  }

  if ($resolved.supabaseSecretKey) {
    $env:SUPABASE_SECRET_KEY = $resolved.supabaseSecretKey
    $env:THRIFTIQ_SUPABASE_SECRET_KEY_SOURCE = $resolved.supabaseSecretKeySource
  }

  Write-Host "Using database URL from $($resolved.databaseUrlSource)."
}

function Stop-LocalSupabase {
  if ($KeepDb) {
    Write-Host 'Keeping database running.'
    return
  }

  $infoJson = & node (Join-Path $PSScriptRoot 'db-url-info.mjs')
  if ($LASTEXITCODE -ne 0) {
    Write-Host 'Could not inspect DATABASE_URL; skipped database stop.'
    return
  }

  $info = $infoJson | ConvertFrom-Json
  if (-not $info.isLocalSupabase) {
    Write-Host 'Hosted database detected; skipped database stop.'
    return
  }

  $supabase = Get-Command supabase -ErrorAction SilentlyContinue
  if ($supabase) {
    Write-Host 'Stopping local Supabase...'
    supabase stop
  } else {
    Write-Host 'Supabase CLI not found; skipped database stop.'
  }
}

Ensure-LocalEnvironment
Ensure-Dependencies
Set-ResolvedEnvironment

if (-not $SkipDb) {
  Write-Host 'Preparing database...'
  & (Join-Path $PSScriptRoot 'db-setup.ps1')
}

Write-Host "Clearing port $Port..."
[void](Stop-PortListeners -TargetPort $Port)

$node = (Get-Command node.exe -ErrorAction Stop).Source
$nextCli = Join-Path $root 'node_modules\next\dist\bin\next'
$process = $null
$script:requestedStop = $false

try {
  Write-Host "Starting ThriftIQ at http://localhost:$Port"
  Write-Host "Type :q then press Enter to stop the dev server."
  $arguments = "`"$nextCli`" dev -p $Port"
  $process = Start-Process `
    -FilePath $node `
    -ArgumentList $arguments `
    -WorkingDirectory $root `
    -NoNewWindow `
    -PassThru

  if ([Console]::IsInputRedirected) {
    while (-not $process.HasExited) {
      $line = [Console]::In.ReadLine()

      if ($null -eq $line) {
        while (-not $process.HasExited) {
          Start-Sleep -Milliseconds 100
        }
        break
      }

      if ($line.Trim() -eq ':q') {
        $script:requestedStop = $true
        break
      }
    }
  } else {
    $buffer = ''
    while (-not $process.HasExited) {
      if ([Console]::KeyAvailable) {
        $key = [Console]::ReadKey($true)

        if ($key.Key -eq 'Enter') {
          Write-Host ''
          if ($buffer.Trim() -eq ':q') {
            $script:requestedStop = $true
            break
          }
          $buffer = ''
        } elseif ($key.Key -eq 'Backspace') {
          if ($buffer.Length -gt 0) {
            $buffer = $buffer.Substring(0, $buffer.Length - 1)
            Write-Host "`b `b" -NoNewline
          }
        } else {
          $buffer += $key.KeyChar
          Write-Host $key.KeyChar -NoNewline
        }
      }

      Start-Sleep -Milliseconds 100
    }
  }
} finally {
  $stoppedRunningServer = $false

  if ($process -and -not $process.HasExited) {
    $stoppedRunningServer = $true
    Stop-ProcessTree -ProcessId $process.Id
  }
  $stoppedPortListeners = Stop-PortListeners -TargetPort $Port
  Write-Host "Dev server stopped and port $Port is clear."
  Stop-LocalSupabase

  exit 0
}
