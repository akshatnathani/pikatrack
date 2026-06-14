$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$distRoot = Join-Path $root 'dist'
$firefoxDir = Join-Path $distRoot 'firefox'
$zipPath = Join-Path $distRoot 'pikadex-firefox.zip'
$resolvedRoot = [System.IO.Path]::GetFullPath($root)
$resolvedDistRoot = [System.IO.Path]::GetFullPath($distRoot)

if (-not $resolvedDistRoot.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Refusing to write outside the project directory: $resolvedDistRoot"
}

if (Test-Path -LiteralPath $firefoxDir) {
  Remove-Item -LiteralPath $firefoxDir -Recurse -Force
}

New-Item -ItemType Directory -Path $firefoxDir | Out-Null

$items = @(
  'background.js',
  'content.js',
  'popup.html',
  'popup.css',
  'popup.js',
  'welcome.html',
  'welcome.css',
  'welcome.js',
  'README.md',
  'icons',
  'scrapers'
)

foreach ($item in $items) {
  $source = Join-Path $root $item
  if (-not (Test-Path -LiteralPath $source)) {
    throw "Missing required extension file: $item"
  }

  Copy-Item -LiteralPath $source -Destination $firefoxDir -Recurse -Force
}

Copy-Item -LiteralPath (Join-Path $root 'manifest.firefox.json') -Destination (Join-Path $firefoxDir 'manifest.json') -Force

if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

Compress-Archive -Path (Join-Path $firefoxDir '*') -DestinationPath $zipPath -Force

Write-Host "Firefox add-on build ready:"
Write-Host "  Folder: $firefoxDir"
Write-Host "  Zip:    $zipPath"
