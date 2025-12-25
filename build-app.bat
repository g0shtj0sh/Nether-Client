@echo off
chcp 65001 >nul
title Nether Client - Compilation

echo.
echo ========================================
echo    NETHER CLIENT - COMPILATION
echo ========================================
echo.

REM Ajouter Cargo au PATH
echo [INFO] Configuration de Cargo...
set PATH=%PATH%;%USERPROFILE%\.cargo\bin

REM Vérifier Cargo
echo [INFO] Vérification de Cargo...
cargo --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Cargo n'est pas installé ou introuvable
    echo [INFO] Installe Rust depuis: https://rustup.rs/
    pause
    exit /b 1
)
echo [OK] Cargo trouvé

REM Vérifier Node.js
echo [INFO] Vérification de Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Node.js n'est pas installé
    echo [INFO] Installe Node.js depuis: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js trouvé

echo.
echo [INFO] Compilation du frontend...
call npm run build
if errorlevel 1 (
    echo [ERREUR] Échec de la compilation du frontend
    pause
    exit /b 1
)

echo.
echo [INFO] Compilation de l'application Tauri...
echo [INFO] Cela peut prendre 5-10 minutes...
call npm run tauri:build

if errorlevel 1 (
    echo.
    echo ========================================
    echo    [ERREUR] ÉCHEC DE LA COMPILATION
    echo ========================================
    echo.
    echo Vérifie les erreurs ci-dessus
    pause
    exit /b 1
)

echo.
echo ========================================
echo    ✓ COMPILATION RÉUSSIE !
echo ========================================
echo.

REM Exécuter le script PowerShell pour modifier le fichier NSIS
echo [INFO] Modification du script de désinstallation...
echo [INFO] Ajout de la suppression automatique du dossier NetherClient...
cd src-tauri
powershell -ExecutionPolicy Bypass -File scripts/post-build-nsis.ps1
if errorlevel 1 (
    echo [AVERTISSEMENT] Le script PowerShell a rencontré une erreur, mais la compilation est réussie
    echo [INFO] Le désinstalleur fonctionnera, mais la suppression automatique du dossier NetherClient pourrait ne pas être active
) else (
    echo [OK] Script de désinstallation modifié avec succès
)
cd ..

echo.
echo ✓ Le setup.exe a été créé avec succès !
echo.
echo 📦 Emplacement du fichier :
echo    %CD%\src-tauri\target\release\bundle\nsis\
echo.
echo 📄 Nom du fichier :
echo    Nether Client_1.0.0_x64-setup.exe
echo.
echo ========================================

REM Vérifier que le fichier existe
if exist "src-tauri\target\release\bundle\nsis\Nether Client_1.0.0_x64-setup.exe" (
    echo ✓ Fichier confirmé : setup.exe trouvé !
    echo.
    
    REM Afficher la taille du fichier
    for %%I in ("src-tauri\target\release\bundle\nsis\Nether Client_1.0.0_x64-setup.exe") do (
        echo 📊 Taille : %%~zI octets
    )
) else (
    echo ⚠ Attention : Le fichier setup.exe n'a pas été trouvé
)

echo.
echo ========================================
set /p response="Ouvrir le dossier du setup.exe ? (O/N): "
if /i "%response%"=="O" (
    explorer "src-tauri\target\release\bundle\nsis"
)

echo.
echo Appuie sur une touche pour fermer...
pause >nul

