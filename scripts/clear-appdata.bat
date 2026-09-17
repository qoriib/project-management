@echo off
REM ============================================================
REM clear-appdata.bat — Wrapper untuk clear-appdata.ps1
REM Jalankan file ini dengan klik dua kali di Windows Explorer
REM ============================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0clear-appdata.ps1"
pause
