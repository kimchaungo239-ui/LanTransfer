$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$distDir = Join-Path $projectRoot "dist"
$outputDir = "D:\Codex\output\lan-file-transfer-portable"
$releaseDir = Join-Path $outputDir "LanTransfer-Windows"
$exeSource = Join-Path $distDir "lan-file-transfer.exe"
$exeTarget = Join-Path $releaseDir "LanTransfer.exe"
$guidePath = Join-Path $releaseDir "README.txt"
$zipPath = Join-Path $outputDir "LanTransfer-Windows.zip"

New-Item -ItemType Directory -Force -Path $distDir | Out-Null
New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null

npx.cmd --yes @yao-pkg/pkg . --targets node24-win-x64 --output $exeSource

Copy-Item -LiteralPath $exeSource -Destination $exeTarget -Force

$guideLines = @(
  "LanTransfer Quick Start",
  "",
  "1. Double-click LanTransfer.exe.",
  "2. If Windows Firewall asks, allow LAN access.",
  "3. The computer console opens in your default browser.",
  "4. Keep the phone and computer on the same Wi-Fi or phone hotspot.",
  "5. Scan the QR code with the phone to upload files to the computer.",
  "6. Default receive folder: Downloads\LanTransfer-Receive.",
  "7. To choose a receive folder from command line:",
  "   LanTransfer.exe D:\ReceiveFolder",
  "8. Keep the LanTransfer.exe window open while transferring files."
)

$guideLines | Set-Content -LiteralPath $guidePath -Encoding UTF8

if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

Compress-Archive -LiteralPath $releaseDir -DestinationPath $zipPath -Force

Write-Output "Release folder: $releaseDir"
Write-Output "Release zip: $zipPath"
