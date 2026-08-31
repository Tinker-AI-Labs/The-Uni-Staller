# Build Uni-Staller as a Windows MSI/EXE on Windows.
# Run from inside the Uni-staller project folder, in PowerShell:
#   Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
#   .\build-windows-local.ps1
# The bash twin of this script (build-windows-local.sh) is for WSL.

$ErrorActionPreference = 'Stop'

Write-Host "==> Checking for Rust..."
if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
  Write-Host "Rust not found - installing via rustup..."
  $rustupExe = Join-Path $env:TEMP 'rustup-init.exe'
  Invoke-WebRequest -Uri 'https://win.rustup.rs/x86_64' -OutFile $rustupExe -UseBasicParsing
  & $rustupExe -y
  if ($LASTEXITCODE -ne 0) { throw "rustup-init failed with exit code $LASTEXITCODE" }
  # rustup only edits PATH for future shells - add it to this one.
  $env:PATH = "$env:USERPROFILE\.cargo\bin;$env:PATH"
} else {
  Write-Host "Rust found: $(rustc --version)"
}

Write-Host "==> Checking for Node.js..."
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw "Node.js not found. Install it first: winget install -e --id OpenJS.NodeJS.LTS"
}
Write-Host "Node found: $(node --version)"

Write-Host "==> Installing JS dependencies..."
npm install
if ($LASTEXITCODE -ne 0) { throw "npm install failed with exit code $LASTEXITCODE" }

Write-Host "==> Building Windows MSI and NSIS Installer..."
npx tauri build --bundles msi,nsis
if ($LASTEXITCODE -ne 0) { throw "tauri build failed with exit code $LASTEXITCODE" }

Write-Host ""
Write-Host "==> Done. Output files:"
Get-ChildItem -Path 'src-tauri\target\release\bundle' -Recurse -Include '*.msi','*.exe' |
  Where-Object { $_.FullName -match '\\(msi|nsis)\\' } |
  ForEach-Object { Write-Host $_.FullName }
