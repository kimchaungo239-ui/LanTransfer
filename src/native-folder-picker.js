import { execFile } from 'node:child_process';

export function createNativeFolderPicker() {
  if (process.platform !== 'win32') {
    return null;
  }
  return pickWindowsFolder;
}

function pickWindowsFolder(initialDir) {
  return new Promise((resolve, reject) => {
    const script = [
      'Add-Type -AssemblyName System.Windows.Forms',
      '$dialog = New-Object System.Windows.Forms.FolderBrowserDialog',
      '$dialog.Description = "Choose LanTransfer receive folder"',
      '$dialog.ShowNewFolderButton = $true',
      `if (Test-Path -LiteralPath ${toPowerShellString(initialDir)}) { $dialog.SelectedPath = ${toPowerShellString(initialDir)} }`,
      '$result = $dialog.ShowDialog()',
      'if ($result -eq [System.Windows.Forms.DialogResult]::OK) { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Write-Output $dialog.SelectedPath }'
    ].join('; ');

    execFile(
      'powershell.exe',
      ['-NoProfile', '-STA', '-ExecutionPolicy', 'Bypass', '-Command', script],
      { windowsHide: false },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr.trim() || error.message));
          return;
        }
        resolve(stdout.trim());
      }
    );
  });
}

function toPowerShellString(value) {
  return `'${String(value || '').replaceAll("'", "''")}'`;
}
