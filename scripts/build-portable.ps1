$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$distDir = Join-Path $projectRoot "dist"
$outputDir = if ($env:LANTRANSFER_PORTABLE_OUTPUT) { $env:LANTRANSFER_PORTABLE_OUTPUT } else { "D:\Codex\output\lan-file-transfer-portable" }
$releaseDir = Join-Path $outputDir "LanTransfer-Windows"
$serverBundle = Join-Path $distDir "server.cjs"
$seaConfigPath = Join-Path $distDir "sea-config.json"
$seaBlobPath = Join-Path $distDir "lan-transfer.blob"
$exeTarget = Join-Path $releaseDir "LanTransfer.exe"
$guidePath = Join-Path $releaseDir "README.txt"
$iconSource = Join-Path $projectRoot "src\assets\lantransfer.ico"
$iconTarget = Join-Path $releaseDir "LanTransfer.ico"
$zipPath = Join-Path $outputDir "LanTransfer-Windows.zip"

New-Item -ItemType Directory -Force -Path $distDir | Out-Null
if (Test-Path -LiteralPath $releaseDir) {
  Remove-Item -LiteralPath $releaseDir -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null

npx.cmd --no-install esbuild src/index.js --bundle --platform=node --format=cjs --outfile=$serverBundle

@{
  main = $serverBundle
  output = $seaBlobPath
  disableExperimentalSEAWarning = $true
  useSnapshot = $false
  useCodeCache = $false
} | ConvertTo-Json | Set-Content -LiteralPath $seaConfigPath -Encoding UTF8

node --experimental-sea-config $seaConfigPath

$nodeExe = (Get-Command node.exe).Source
Copy-Item -LiteralPath $nodeExe -Destination $exeTarget -Force

npx.cmd --no-install postject $exeTarget NODE_SEA_BLOB $seaBlobPath `
  --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 `
  --overwrite

Copy-Item -LiteralPath (Join-Path $projectRoot "src\public") -Destination (Join-Path $releaseDir "public") -Recurse -Force
Copy-Item -LiteralPath $iconSource -Destination $iconTarget -Force

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
