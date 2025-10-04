param(
  [int]$MaxId = 6000,
  [int]$DelayMs = 150,
  [int]$MaxFailures = 150,
  [string]$EnvFile = '.env.local'
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
Set-Location $projectRoot

function Get-EnvValue([string]$Key) {
  if (-not (Test-Path $EnvFile)) {
    throw "Env file '$EnvFile' not found"
  }
  $line = Select-String -Path $EnvFile -Pattern "^$Key=" -ErrorAction SilentlyContinue | Select-Object -Last 1
  if (-not $line) {
    return $null
  }
  return $line.Line.Split('=', 2)[1]
}

$env:PRINTFUL_API_KEY = Get-EnvValue 'PRINTFUL_API_KEY'
$env:PRINTFUL_STORE_ID = Get-EnvValue 'PRINTFUL_STORE_ID'
if (-not $env:PRINTFUL_API_KEY) { throw 'PRINTFUL_API_KEY missing in env file' }

$env:PRINTFUL_API_SCRAPE_BASE = 'https://api.printful.com/products'
$env:PRINTFUL_SCRAPE_MAX_ID = $MaxId.ToString()
$env:PRINTFUL_SCRAPE_DELAY_MS = $DelayMs.ToString()
$env:PRINTFUL_SCRAPE_MAX_FAILURES = $MaxFailures.ToString()
$env:PRINTFUL_SCRAPE_SILENT = '1'

$logsDir = Join-Path $projectRoot 'logs'
if (-not (Test-Path $logsDir)) {
  New-Item -ItemType Directory -Path $logsDir | Out-Null
}
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$logPath = Join-Path $logsDir "printful-scrape-$timestamp.log"

& node .\scripts\scrape-printful-catalog.mjs --silent *> $logPath
