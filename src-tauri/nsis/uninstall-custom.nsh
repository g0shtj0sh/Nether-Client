; Script personnalisé pour supprimer le dossier NetherClient dans %APPDATA% (Roaming) lors de la désinstallation
; Ce fichier sera inclus dans le script NSIS généré par Tauri

; Fonction pour supprimer le dossier NetherClient dans %APPDATA% (Roaming)
Function un.DeleteNetherClientAppData
  ; Lire explicitement la variable d'environnement %APPDATA% (Roaming)
  ; Cela garantit qu'on utilise bien Roaming et non Local
  ReadEnvStr $0 "APPDATA"
  
  ; Vérifier que la variable a été lue correctement
  StrCmp $0 "" end
  
  ; Construire le chemin complet vers NetherClient dans Roaming
  StrCpy $1 "$0\NetherClient"
  
  ; Vérifier si le dossier existe avant de le supprimer
  IfFileExists "$1\*.*" 0 end
    RmDir /r "$1"
    ; MessageBox MB_OK "Le dossier NetherClient a été supprimé de %APPDATA% (Roaming): $1"
  
  end:
FunctionEnd

