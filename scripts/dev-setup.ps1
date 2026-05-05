$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $root

Write-Host 'Installing dependencies...'
npm install

$envLocal = Join-Path $root '.env.local'
$envExample = Join-Path $root '.env.example'

if (-not (Test-Path $envLocal)) {
  if (-not (Test-Path $envExample)) {
    throw '.env.example was not found.'
  }

  Copy-Item -LiteralPath $envExample -Destination $envLocal
  Write-Host 'Created .env.local from .env.example.'
} else {
  Write-Host '.env.local already exists.'
}

Write-Host ''
Write-Host 'Local setup complete.'
Write-Host 'Next: fill any needed values in .env.local, then run npm run dev:local.'
