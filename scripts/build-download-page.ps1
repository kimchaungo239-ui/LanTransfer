$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$siteSourceDir = Join-Path $projectRoot "site"
$portableZip = "D:\Codex\output\lan-file-transfer-portable\LanTransfer-Windows.zip"
$outputDir = "D:\Codex\output\lan-transfer-download-page"
$downloadDir = Join-Path $outputDir "downloads"

if (!(Test-Path -LiteralPath (Join-Path $siteSourceDir "index.html"))) {
  throw "Missing site source: $siteSourceDir"
}

if (!(Test-Path -LiteralPath $portableZip)) {
  throw "Missing portable zip. Run npm.cmd run build:win first."
}

if (Test-Path -LiteralPath $outputDir) {
  Remove-Item -LiteralPath $outputDir -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
New-Item -ItemType Directory -Force -Path $downloadDir | Out-Null

Copy-Item -LiteralPath (Join-Path $siteSourceDir "index.html") -Destination $outputDir -Force
Copy-Item -LiteralPath (Join-Path $siteSourceDir "styles.css") -Destination $outputDir -Force
Copy-Item -LiteralPath $portableZip -Destination (Join-Path $downloadDir "LanTransfer-Windows.zip") -Force

Write-Output "Download page: $outputDir"
Write-Output "Download zip:  $(Join-Path $downloadDir "LanTransfer-Windows.zip")"
