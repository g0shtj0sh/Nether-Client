# Script PowerShell pour modifier le fichier NSIS genere et inclure notre script personnalise
# Ce script sera execute apres le build pour modifier installer.nsi
# Usage: .\scripts\post-build-nsis.ps1

$ErrorActionPreference = "Stop"

# Chemins relatifs depuis src-tauri
$nsisFile = "target\release\nsis\x64\installer.nsi"
$customScript = "nsis\uninstall-custom.nsh"
$nsisDir = "target\release\nsis\x64"

Write-Host "=== Modification du fichier NSIS pour inclure la suppression de NetherClient ===" -ForegroundColor Cyan

# Verifier si le fichier NSIS existe
if (-not (Test-Path $nsisFile)) {
    Write-Host "ERREUR: Fichier NSIS non trouve: $nsisFile" -ForegroundColor Red
    Write-Host "Assurez-vous d'avoir execute 'cargo tauri build' d'abord." -ForegroundColor Yellow
    exit 1
}

# Copier notre script personnalise dans le dossier NSIS
if (Test-Path $customScript) {
    $destScript = Join-Path $nsisDir "uninstall-custom.nsh"
    Copy-Item $customScript $destScript -Force
    Write-Host "Script personnalise copie: $destScript" -ForegroundColor Green
} else {
    Write-Host "ERREUR: Script personnalise non trouve: $customScript" -ForegroundColor Red
    exit 1
}

# Lire le contenu du fichier NSIS
$content = Get-Content $nsisFile -Raw -Encoding UTF8

# Verifier si notre script n'est pas deja inclus
if ($content -match "uninstall-custom\.nsh") {
    Write-Host "Le script personnalise est deja inclus dans le fichier NSIS" -ForegroundColor Yellow
    exit 0
}

# Inclure notre script personnalise apres les autres includes
$customInclude = '!include "uninstall-custom.nsh"' + [Environment]::NewLine

# Trouver une bonne position pour l'inclure (apres les includes de base)
$includeAdded = $false

# Essayer de trouver English.nsh
$englishPattern = '(!include "English\.nsh"[\r\n]+)'
if ($content -match $englishPattern) {
    $replacement = '$1' + $customInclude
    $content = $content -replace $englishPattern, $replacement
    $includeAdded = $true
    Write-Host "Include ajoute apres English.nsh" -ForegroundColor Green
}

# Si pas trouve, essayer StrFunc.nsh
if (-not $includeAdded) {
    $strFuncPattern = '(!include "StrFunc\.nsh"[\r\n]+)'
    if ($content -match $strFuncPattern) {
        $replacement = '$1' + $customInclude
        $content = $content -replace $strFuncPattern, $replacement
        $includeAdded = $true
        Write-Host "Include ajoute apres StrFunc.nsh" -ForegroundColor Green
    }
}

# Si toujours pas trouve, utiliser un pattern generique
if (-not $includeAdded) {
    Write-Host "AVERTISSEMENT: Impossible de trouver une position pour l'include. Ajout a la fin des includes." -ForegroundColor Yellow
    $genericPattern = '(!include[^\r\n]+[\r\n]+)'
    if ($content -match $genericPattern) {
        $replacement = '$1' + $customInclude
        $content = $content -replace $genericPattern, $replacement
    }
}

# Ajouter l'appel a notre fonction dans la section Uninstall
# Chercher la ligne "; Delete app data" et ajouter notre fonction juste avant
$newLine = [Environment]::NewLine
$functionCall = "  ; Supprimer le dossier NetherClient dans %APPDATA%$newLine  Call un.DeleteNetherClientAppData$newLine$newLine"

if ($content -match "; Delete app data") {
    $replacement = $functionCall + '$1'
    $content = $content -replace "(; Delete app data)", $replacement
    Write-Host "Appel a la fonction ajoute dans la section Uninstall" -ForegroundColor Green
} else {
    Write-Host "AVERTISSEMENT: Impossible de trouver '; Delete app data'. Ajout a la fin de la section Uninstall." -ForegroundColor Yellow
    if ($content -match "(SectionEnd)") {
        $replacement = $functionCall + '$1'
        $content = $content -replace "(SectionEnd)", $replacement
    }
}

# Ecrire le contenu modifie
try {
    Set-Content -Path $nsisFile -Value $content -NoNewline -Encoding UTF8
    Write-Host "Fichier NSIS modifie avec succes: $nsisFile" -ForegroundColor Green
    Write-Host "" -ForegroundColor Cyan
    Write-Host "=== Modification terminee ===" -ForegroundColor Cyan
    Write-Host "Le desinstalleur supprimera maintenant automatiquement le dossier NetherClient dans %APPDATA%" -ForegroundColor Cyan
} catch {
    Write-Host "ERREUR lors de l'ecriture du fichier: $_" -ForegroundColor Red
    exit 1
}
