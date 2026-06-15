$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$siteSourceDir = Join-Path $projectRoot "site"
$portableOutputDir = if ($env:LANTRANSFER_PORTABLE_OUTPUT) { $env:LANTRANSFER_PORTABLE_OUTPUT } else { "D:\Codex\output\lan-file-transfer-portable" }
$portableZip = if ($env:LANTRANSFER_PORTABLE_ZIP) { $env:LANTRANSFER_PORTABLE_ZIP } else { Join-Path $portableOutputDir "LanTransfer-Windows.zip" }
$outputDir = if ($env:LANTRANSFER_SITE_OUTPUT) { $env:LANTRANSFER_SITE_OUTPUT } else { "D:\Codex\output\lan-transfer-download-page" }
$downloadDir = Join-Path $outputDir "downloads"

if (!(Test-Path -LiteralPath (Join-Path $siteSourceDir "index.html"))) {
  throw "Missing site source: $siteSourceDir"
}

if (!(Test-Path -LiteralPath $portableZip)) {
  throw "Missing portable zip. Run npm.cmd run build:win first."
}

New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
New-Item -ItemType Directory -Force -Path $downloadDir | Out-Null

function Copy-WithRetry {
  param(
    [Parameter(Mandatory = $true)][string]$Source,
    [Parameter(Mandatory = $true)][string]$Destination
  )

  for ($attempt = 1; $attempt -le 5; $attempt++) {
    try {
      if (Test-Path -LiteralPath $Destination) {
        Remove-Item -LiteralPath $Destination -Force
      }
      Copy-Item -LiteralPath $Source -Destination $Destination -Force
      return
    } catch {
      if ($attempt -eq 5) {
        throw
      }
      Start-Sleep -Milliseconds (200 * $attempt)
    }
  }
}

Copy-WithRetry -Source (Join-Path $siteSourceDir "index.html") -Destination (Join-Path $outputDir "index.html")
Copy-WithRetry -Source (Join-Path $siteSourceDir "styles.css") -Destination (Join-Path $outputDir "styles.css")
Copy-WithRetry -Source (Join-Path $siteSourceDir "site.js") -Destination (Join-Path $outputDir "site.js")
$downloadZip = Join-Path $downloadDir "LanTransfer-Windows.zip"
Copy-WithRetry -Source $portableZip -Destination $downloadZip

Write-Output "Download page: $outputDir"
Write-Output "Download zip:  $downloadZip"
