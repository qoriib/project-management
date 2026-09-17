# =============================================================
# clear-appdata.ps1 — Hapus data aplikasi Manajemen Proyek (Windows)
# Tauri app identifier : com.laman.project
# Product name         : Manajemen Proyek
# =============================================================

$AppIdentifier = "com.laman.project"
$AppName       = "Manajemen Proyek"

$Cyan   = "Cyan"
$Yellow = "Yellow"
$Green  = "Green"
$Red    = "Red"

Write-Host "======================================" -ForegroundColor $Cyan
Write-Host "  Hapus App Data — $AppName"           -ForegroundColor $Cyan
Write-Host "======================================" -ForegroundColor $Cyan
Write-Host ""

# Daftar direktori yang akan dihapus
$Paths = @(
  # AppData\Roaming  (Application Support equivalent)
  "$env:APPDATA\$AppIdentifier",
  "$env:APPDATA\$AppName",
  # AppData\Local    (Caches / Local equivalent)
  "$env:LOCALAPPDATA\$AppIdentifier",
  "$env:LOCALAPPDATA\$AppName",
  # WebView2 / EBWebView cache
  "$env:LOCALAPPDATA\$AppIdentifier\EBWebView",
  "$env:LOCALAPPDATA\$AppName\EBWebView"
)

$Found = $false

foreach ($Dir in $Paths) {
  if (Test-Path $Dir) {
    $Found = $true
    Write-Host "Ditemukan: $Dir" -ForegroundColor $Yellow
  }
}

if (-not $Found) {
  Write-Host "Tidak ada data aplikasi yang ditemukan." -ForegroundColor $Green
  exit 0
}

Write-Host ""
$Confirm = Read-Host "Hapus semua direktori di atas? (y/N)"

if ($Confirm -ne "y" -and $Confirm -ne "Y") {
  Write-Host "Dibatalkan." -ForegroundColor $Yellow
  exit 0
}

Write-Host ""

foreach ($Dir in $Paths) {
  if (Test-Path $Dir) {
    Remove-Item -Recurse -Force $Dir
    Write-Host "✓ Dihapus: $Dir" -ForegroundColor $Green
  }
}

Write-Host ""
Write-Host "✅ Selesai! Semua data aplikasi telah dihapus." -ForegroundColor $Green
