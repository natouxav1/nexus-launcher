@echo off
title Nexus Launcher Builder
color 0A
cd /d "%~dp0"

echo ==============================================
echo      Nexus Launcher - Auto Build ^& Deploy
echo ==============================================
echo.

REM ============================================
REM  Step 1: Read current version from package.json
REM ============================================
for /f "tokens=2 delims=:, " %%a in ('findstr /C:"\"version\"" package.json') do (
    set "RAW_VER=%%~a"
)
set "CURRENT_VER=%RAW_VER:"=%"
echo [INFO] Current version: %CURRENT_VER%

REM ============================================
REM  Step 2: Auto-increment patch version
REM ============================================
for /f "tokens=1,2,3 delims=." %%a in ("%CURRENT_VER%") do (
    set "MAJOR=%%a"
    set "MINOR=%%b"
    set /a "PATCH=%%c + 1"
)
set "NEW_VER=%MAJOR%.%MINOR%.%PATCH%"
echo [INFO] New version: %NEW_VER%

REM ============================================
REM  Step 3: Update package.json with new version
REM ============================================
echo [INFO] Updating package.json...
powershell -Command "(Get-Content 'package.json') -replace '\"version\": \"%CURRENT_VER%\"', '\"version\": \"%NEW_VER%\"' | Set-Content 'package.json'"
if %errorlevel% neq 0 (
    echo [ERROR] Failed to update package.json!
    pause
    exit /b 1
)

REM ============================================
REM  Step 4: Build launcher
REM ============================================
echo.
echo [INFO] Building Launcher v%NEW_VER% (TSC + Vite + Electron-Builder)...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed!
    pause
    exit /b %errorlevel%
)

REM ============================================
REM  Step 4b: Build custom installer UI
REM ============================================
echo.
echo [INFO] Building custom installer UI...

REM Copy the NSIS silent installer into installer-ui resources so it can be bundled
if not exist "installer-ui\resources" mkdir "installer-ui\resources"

REM Find the freshly-built NSIS installer (oneClick=false produces a Setup exe)
if exist "release\%NEW_VER%\Nexus Launcher Setup %NEW_VER%.exe" (
    copy /Y "release\%NEW_VER%\Nexus Launcher Setup %NEW_VER%.exe" "installer-ui\resources\nsis-installer.exe"
    echo [INFO] Copied NSIS installer into installer-ui\resources\
) else (
    echo [WARNING] NSIS installer not found – installer UI will not embed it.
)

REM Install installer-ui deps if needed
if not exist "installer-ui\node_modules" (
    echo [INFO] Installing installer-ui dependencies...
    cd installer-ui
    call npm install
    cd ..
)

REM Build the installer UI app
cd installer-ui
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Installer UI build failed!
    cd ..
    pause
    exit /b %errorlevel%
)
cd ..

REM The portable EXE is in installer-ui\dist-installer\
set "INSTALLER_UI_EXE=installer-ui\dist-installer\Nexus Launcher Setup.exe"
if not exist "%INSTALLER_UI_EXE%" (
    echo [WARNING] Custom installer UI exe not found at %INSTALLER_UI_EXE%
)

REM ============================================
REM  Step 5: Copy installer to release root
REM ============================================
echo.
echo [INFO] Copying installer to release root...

REM Prefer the custom Electron installer UI; fall back to raw NSIS
if exist "%INSTALLER_UI_EXE%" goto :copy_ui
if exist "release\%NEW_VER%\Nexus Launcher Setup %NEW_VER%.exe" goto :copy_nsis
echo [WARNING] Could not find any installer.
pause
exit /b 1

:copy_ui
copy /Y "%INSTALLER_UI_EXE%" "release\Nexus Launcher Setup %NEW_VER%.exe"
echo [INFO] Copied custom installer UI to release root.
goto :do_upload

:copy_nsis
copy /Y "release\%NEW_VER%\Nexus Launcher Setup %NEW_VER%.exe" "release\Nexus Launcher Setup %NEW_VER%.exe"
echo [INFO] Copied NSIS installer to release root (UI build unavailable).
goto :do_upload

:do_upload

REM ============================================
REM  Step 6: Upload to VPS
REM ============================================
echo.
echo [INFO] Uploading to VPS...
set "UPLOAD_DEST=root@192.168.1.109:/home/cheat/api/base/nexus-launcher/Nexus-Launcher-%NEW_VER%.exe"
set "UPLOAD_SRC=release\Nexus Launcher Setup %NEW_VER%.exe"
.\pscp.exe -C -sftp -pw Natouxa^! "%UPLOAD_SRC%" %UPLOAD_DEST%
if %errorlevel% neq 0 (
    echo [ERROR] Upload failed!
    pause
    exit /b 1
)
echo [INFO] Upload complete.

REM ============================================
REM  Step 7: Update launcher-version.json on VPS
REM ============================================
echo.
echo [INFO] Updating version on VPS to %NEW_VER%...
powershell -File .\update_vps_version.ps1 %NEW_VER%

echo.
echo ==============================================
echo      BUILD ^& DEPLOY SUCCESSFUL!
echo      Version: %NEW_VER%
echo ==============================================
echo.
pause
