param(
  [string]$DatabaseUrl
)

$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $root

function Get-DatabaseUrl {
  if ($DatabaseUrl) {
    return $DatabaseUrl
  }

  if ($env:DATABASE_URL) {
    return $env:DATABASE_URL
  }

  $envLocal = Join-Path $root '.env.local'
  if (Test-Path $envLocal) {
    $line = Get-Content -LiteralPath $envLocal |
      Where-Object { $_ -match '^DATABASE_URL=' } |
      Select-Object -First 1

    if ($line) {
      $value = $line.Substring('DATABASE_URL='.Length).Trim('"').Trim("'")
      if ($value) {
        return $value
      }
    }
  }

  return 'postgres://postgres:postgres@127.0.0.1:54322/postgres'
}

$url = Get-DatabaseUrl
& node (Join-Path $PSScriptRoot 'db-port-check.mjs') $url
if ($LASTEXITCODE -ne 0) {
  throw 'Database port is not reachable.'
}
