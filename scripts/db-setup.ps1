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

  Set-ResolvedEnvironment
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
