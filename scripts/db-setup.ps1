param(
  [string]$DatabaseUrl = 'postgres://postgres:postgres@127.0.0.1:54322/postgres',
  [switch]$SkipSupabaseStart
)

$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $root

function Ensure-Dependencies {
  if (-not (Test-Path (Join-Path $root 'node_modules\.bin\drizzle-kit.cmd'))) {
    Write-Host 'Dependencies are missing. Running npm install...'
    npm install
  }
}

function Ensure-LocalEnvironment {
  $envLocal = Join-Path $root '.env.local'
  $envExample = Join-Path $root '.env.example'

  if (-not (Test-Path $envLocal)) {
    if (-not (Test-Path $envExample)) {
      throw '.env.example was not found.'
    }

    Copy-Item -LiteralPath $envExample -Destination $envLocal
    Write-Host 'Created .env.local from .env.example.'
  }

  $content = Get-Content -LiteralPath $envLocal
  $hasDatabaseUrl = $false
  $updated = foreach ($line in $content) {
    if ($line -match '^DATABASE_URL=') {
      $hasDatabaseUrl = $true
      if ($line.Trim() -eq 'DATABASE_URL=') {
        "DATABASE_URL=$DatabaseUrl"
      } else {
        $line
      }
    } else {
      $line
    }
  }

  if (-not $hasDatabaseUrl) {
    $updated += "DATABASE_URL=$DatabaseUrl"
  }

  Set-Content -LiteralPath $envLocal -Value $updated
  $env:DATABASE_URL = Get-DatabaseUrlFromEnvFile -Path $envLocal
}

function Get-DatabaseUrlFromEnvFile {
  param([string]$Path)

  $line = Get-Content -LiteralPath $Path |
    Where-Object { $_ -match '^DATABASE_URL=' } |
    Select-Object -First 1

  if (-not $line) {
    return $DatabaseUrl
  }

  return $line.Substring('DATABASE_URL='.Length).Trim('"').Trim("'")
}

function Test-DatabasePort {
  param([string]$Url)

  & node (Join-Path $PSScriptRoot 'db-port-check.mjs') $Url
  if ($LASTEXITCODE -ne 0) {
    throw 'Database port is not reachable.'
  }
}

function Test-IsLocalSupabaseUrl {
  param([string]$Url)

  $infoJson = & node (Join-Path $PSScriptRoot 'db-url-info.mjs') $Url
  if ($LASTEXITCODE -ne 0) {
    return $false
  }

  $info = $infoJson | ConvertFrom-Json
  return ($info.host -eq '127.0.0.1' -or $info.host -eq 'localhost') -and $info.port -eq 54322
}

function Start-LocalSupabaseIfAvailable {
  param([string]$Url)

  if ($SkipSupabaseStart -or -not (Test-IsLocalSupabaseUrl -Url $Url)) {
    return
  }

  $supabase = Get-Command supabase -ErrorAction SilentlyContinue
  if (-not $supabase) {
    return
  }

  Write-Host 'Local Supabase database is not reachable. Starting Supabase...'
  supabase start
}

function Get-MaskedDatabaseUrl {
  param([string]$Url)

  return (& node (Join-Path $PSScriptRoot 'db-url-info.mjs') $Url --mask)
}

Ensure-Dependencies
Ensure-LocalEnvironment

Write-Host "Checking database at $(Get-MaskedDatabaseUrl -Url $env:DATABASE_URL)"
try {
  Test-DatabasePort -Url $env:DATABASE_URL
} catch {
  Start-LocalSupabaseIfAvailable -Url $env:DATABASE_URL

  try {
    Test-DatabasePort -Url $env:DATABASE_URL
  } catch {
    Write-Host ''
    Write-Host 'Database is not reachable.'
    Write-Host 'For local Supabase, start it with: supabase start'
    Write-Host 'Or set DATABASE_URL in .env.local to a running Postgres database.'
    throw
  }
}

$migrations = Get-ChildItem -Path (Join-Path $root 'drizzle') -Filter '*.sql' -File -ErrorAction SilentlyContinue
if (-not $migrations) {
  Write-Host 'No Drizzle migrations found. Generating initial migration...'
  npm run db:generate
}

Write-Host 'Applying database migrations...'
npm run db:migrate

Write-Host 'Preparing Supabase storage...'
& (Join-Path $PSScriptRoot 'storage-setup.ps1')

Write-Host ''
Write-Host 'Database setup complete.'
