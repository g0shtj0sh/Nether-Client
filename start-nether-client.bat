@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"
title Nether Client - Demarrage
echo.
echo ===============================================================
echo   DEMARRAGE RAPIDE - NETHER CLIENT
echo ===============================================================
echo.

REM Ajouter Rust au PATH
echo [INFO] Configuration du PATH Rust...
set "PATH=%PATH%;%USERPROFILE%\.cargo\bin"

REM Verifier que Rust est accessible
echo [INFO] Verification de Rust...
rustc --version >nul 2>&1
if !errorlevel! neq 0 (
    echo [ERREUR] Rust non trouve
    echo [INFO] Installez Rust depuis: https://rustup.rs/
    echo.
    echo Appuyez sur une touche pour fermer...
    pause >nul
    exit /b 1
)
echo [OK] Rust trouve

REM Verifier Cargo
echo [INFO] Verification de Cargo...
cargo --version >nul 2>&1
if !errorlevel! neq 0 (
    echo [ERREUR] Cargo non trouve
    echo.
    echo Appuyez sur une touche pour fermer...
    pause >nul
    exit /b 1
)
echo [OK] Cargo trouve

REM Verifier Node.js
echo [INFO] Verification de Node.js...
node --version >nul 2>&1
if !errorlevel! neq 0 (
    echo [ERREUR] Node.js non trouve
    echo [INFO] Installez Node.js depuis: https://nodejs.org/
    echo.
    echo Appuyez sur une touche pour fermer...
    pause >nul
    exit /b 1
)
echo [OK] Node.js trouve

REM Verifier si les dependances npm sont installees
echo [INFO] Verification des dependances npm...
if not exist "node_modules\" (
    echo [INFO] Dossier node_modules non trouve
    echo [INFO] Installation des dependances npm...
    echo.
    call npm install
    if !errorlevel! neq 0 (
        echo.
        echo [ERREUR] Echec de l'installation des dependances npm
        echo.
        echo Appuyez sur une touche pour fermer...
        pause >nul
        exit /b 1
    )
    echo [OK] Dependances npm installees avec succes
) else (
    echo [OK] Dependances npm deja installees
)

echo.
echo [INFO] Lancement de Nether Client en mode developpement...
echo [INFO] Cela peut prendre quelques secondes...
echo.

REM Lancer l'application
call npm run tauri:dev

if !errorlevel! neq 0 (
    echo.
    echo ===============================================================
    echo   [ERREUR] ECHEC DU DEMARRAGE
    echo ===============================================================
    echo.
    echo Verifiez les erreurs ci-dessus
    echo.
    echo Appuyez sur une touche pour fermer...
    pause >nul
    exit /b 1
)

echo.
echo Appuyez sur une touche pour fermer...
pause >nul
