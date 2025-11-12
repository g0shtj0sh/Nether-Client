# Instructions pour générer les icônes

Pour générer les icônes nécessaires pour l'application, vous pouvez utiliser l'outil en ligne suivant :

1. Allez sur https://tauri.app/v1/guides/features/icons/
2. Utilisez l'icône SVG fournie (src-tauri/icons/icon.svg)
3. Générez les formats suivants :
   - 32x32.png
   - 128x128.png
   - 128x128@2x.png
   - icon.icns (macOS)
   - icon.ico (Windows)

Ou utilisez ImageMagick :
```bash
# Générer les PNG
magick src-tauri/icons/icon.svg -resize 32x32 src-tauri/icons/32x32.png
magick src-tauri/icons/icon.svg -resize 128x128 src-tauri/icons/128x128.png
magick src-tauri/icons/icon.svg -resize 256x256 src-tauri/icons/128x128@2x.png

# Générer l'ICO pour Windows
magick src-tauri/icons/icon.svg -resize 256x256 src-tauri/icons/icon.ico
```
