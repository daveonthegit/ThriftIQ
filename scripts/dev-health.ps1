param(
  [string]$Url = 'http://localhost:3000/api/health'
)

$ErrorActionPreference = 'Stop'

Write-Host "Checking $Url"
$response = Invoke-RestMethod -Uri $Url
$response | ConvertTo-Json -Depth 6

if ($response.ok -ne $true) {
  exit 1
}
