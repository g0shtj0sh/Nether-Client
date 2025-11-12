@echo off
chcp 65001 >nul
title Nether Client - Démarrage
echo.
echo ===============================================================
echo   DEMARRAGE RAPIDE - NETHER CLIENT
echo ===============================================================
echo.

REM Ajouter Rust au PATH
echo [INFO] Configuration du PATH Rust...
set "PATH=%PATH%;%USERPROFILE%\.cargo\bin"

REM Vérifier que Rust est accessible
echo [INFO] Vérification de Rust...
rustc --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Rust non trouvé
    echo [INFO] Installez Rust depuis: https://rustup.rs/
    echo.
    echo Appuyez sur une touche pour fermer...
    pause >nul
    exit /b 1
)
echo [OK] Rust trouvé

REM Vérifier Cargo
echo [INFO] Vérification de Cargo...
cargo --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Cargo non trouvé
    echo.
    echo Appuyez sur une touche pour fermer...
    pause >nul
    exit /b 1
)
echo [OK] Cargo trouvé

REM Vérifier Node.js
echo [INFO] Vérification de Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js non trouvé
    echo [INFO] Installez Node.js depuis: https://nodejs.org/
    echo.
    echo Appuyez sur une touche pour fermer...
    pause >nul
    exit /b 1
)
echo [OK] Node.js trouvé

echo.
echo [INFO] Lancement de Nether Client...
echo [INFO] Cela peut prendre quelques secondes...
echo.

REM Lancer l'application
call npm run tauri:dev

if %errorlevel% neq 0 (
    echo.
    echo ===============================================================
    echo   [ERREUR] ÉCHEC DU DÉMARRAGE
    echo ===============================================================
    echo.
    echo Vérifiez les erreurs ci-dessus
    echo.
    echo Appuyez sur une touche pour fermer...
    pause >nul
    exit /b 1
)

echo.
echo Appuyez sur une touche pour fermer...
pause >nul
