$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $root

Write-Host 'Running typecheck...'
npm run typecheck

Write-Host 'Running lint...'
npm run lint

Write-Host 'Running production build...'
npm run build

Write-Host ''
Write-Host 'Verification complete.'
