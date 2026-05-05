param(
  [string]$BucketName
)

$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $root

$node = Get-Command node -ErrorAction Stop
$script = Join-Path $PSScriptRoot 'storage-setup.mjs'

if ($BucketName) {
  & $node.Source $script $BucketName
} else {
  & $node.Source $script
}
