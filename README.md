# 🔥 Nether Client

**Application complète de gestion de serveurs Minecraft locaux**

![Version](https://img.shields.io/badge/version-1.0.0-purple)
![Tauri](https://img.shields.io/badge/Tauri-1.5-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![Rust](https://img.shields.io/badge/Rust-1.70+-orange)

---

## 🎯 Description

**Nether Client** est une application Windows moderne permettant de créer, configurer et gérer des serveurs Minecraft localement. Interface inspirée de CurseForge avec thème sombre et accent violet.

### ✨ Fonctionnalités

- 🎮 **Création automatique** de serveurs Vanilla, Forge et NeoForge
- 📊 **Dashboard** en temps réel (RAM, joueurs, uptime, activité)
- 💻 **Terminal intégré** avec logs et commandes en temps réel
- 🌐 **Support Playit.gg** pour accès public
- 🧩 **Gestion de mods** avec analyse de conflits
- 👥 **Gestion des joueurs** avec modération avancée (ban, whitelist, OP, kick)
- 🎨 **Skins Minecraft** pour les joueurs
- 📈 **Monitoring avancé** avec graphiques de performance
- 🌍 **Multi-langue** (Français/Anglais)
- 💾 **Sauvegardes automatiques**
- 🎨 **UI moderne** avec animations fluides
- 🌐 **Site web** de présentation avec page de statut

---

## 🚀 Démarrage Rapide

### 1️⃣ Vérifier les Prérequis

```powershell
.\check-requirements.ps1
```

### 2️⃣ Installer Rust (si nécessaire)

```powershell
# Avec winget
winget install Rustlang.Rustup

# Ou télécharger depuis https://rustup.rs/
```

### 3️⃣ Installer les Dépendances

```powershell
npm install
```

### 4️⃣ Lancer l'Application

```powershell
# Mode développement
npm run tauri:dev

# Compiler le .exe
npm run tauri:build
```

---

## 📋 Prérequis

| Outil   | Version | Statut                     | Installation          |
| ------- | ------- | -------------------------- | --------------------- |
| Node.js | 18+     | ✅ Installé               | https://nodejs.org/   |
| npm     | 8+      | ✅ Installé               | (avec Node.js)        |
| Rust    | 1.70+   | ⚠️**À installer** | https://rustup.rs/    |
| Cargo   | Latest  | ⚠️**À installer** | (avec Rust)           |
| Java    | 8/17/21 | ✅ Installé               | https://adoptium.net/ |

**⚠️ Rust est obligatoire pour compiler Tauri !**

Pour installer Rust, utilisez `winget install Rustlang.Rustup` ou téléchargez depuis https://rustup.rs/

---

## 🏗️ Structure du Projet

```
Nether Client/
├── src/                      # Frontend React + TypeScript
│   ├── components/          # Composants UI
│   │   ├── builders/       # JavaBuilder, ForgeBuilder, NeoForgeBuilder
│   │   ├── dashboard/      # Widgets dashboard
│   │   └── layout/         # Sidebar, Header
│   ├── pages/              # Pages principales
│   │   ├── Dashboard.tsx   # Vue d'ensemble
│   │   ├── Servers.tsx     # Gestion serveurs
│   │   ├── Terminal.tsx    # Terminal intégré
│   │   ├── Network.tsx     # Playit.gg
│   │   ├── Mods.tsx        # Gestion mods
│   │   ├── Players.tsx     # Gestion joueurs
│   │   └── Settings.tsx    # Paramètres
│   ├── services/           # APIs externes
│   │   ├── minecraftAPI.ts # API Mojang
│   │   ├── forgeAPI.ts     # Maven Forge
│   │   └── neoforgeAPI.ts  # Maven NeoForge
│   ├── hooks/              # Hooks React
│   ├── utils/              # Utilitaires
│   └── config/             # Configuration APIs
│
├── src-tauri/               # Backend Rust
│   ├── src/
│   │   └── main.rs         # Commandes Tauri
│   ├── icons/              # Icônes application
│   └── tauri.conf.json     # Configuration Tauri
│
├── Website/                 # Site web de présentation
│   └── Nether Client WebSite/
│       ├── index.html       # Page principale
│       ├── status.html      # Page de statut
│       ├── img/             # Images (Logo, favicon)
│       └── README.md        # Documentation site web
│
├── check-requirements.ps1   # Script vérification
├── INSTALLATION_RAPIDE.md   # Guide installation
└── README.md               # Ce fichier
```

---

## 🎨 Technologies

### Frontend

- **React 18** - UI moderne et réactive
- **TypeScript** - Typage statique
- **TailwindCSS** - Styles utilitaires
- **Framer Motion** - Animations fluides
- **Lucide React** - Icônes modernes

### Backend

- **Tauri 1.5** - Framework desktop natif
- **Rust** - Performance et sécurité
- **Tokio** - Runtime asynchrone
- **Reqwest** - Requêtes HTTP

---

## 📡 APIs Connectées

| API                      | Usage                      | Status             |
| ------------------------ | -------------------------- | ------------------ |
| **Mojang API**     | Versions Minecraft Vanilla | ✅ Connectée      |
| **Maven Forge**    | Versions Forge             | ✅ Connectée      |
| **Maven NeoForge** | Versions NeoForge          | ✅ Connectée      |
| **Playit.gg**      | Tunneling réseau          | 🔄 À implémenter |

Voir `API_GUIDE.md` pour plus de détails.

---

## 🔧 Commandes Disponibles

```powershell
# Développement
npm run dev              # Lancer Vite (frontend uniquement)
npm run tauri:dev        # Lancer l'app complète (frontend + backend)

# Build
npm run build            # Compiler le frontend
npm run tauri:build      # Compiler l'app complète (.exe)

# Vérifications
.\check-requirements.ps1 # Vérifier les prérequis
```

---

## 📦 Build et Distribution

### Compiler le .exe

```powershell
npm run tauri:build
```

Le `.exe` sera généré dans :

```
src-tauri/target/release/
├── Nether Client.exe           # Application
└── bundle/
    ├── msi/                    # Installeur MSI
    └── nsis/                   # Installeur NSIS
```

### Taille de l'Application

- **Frontend compilé** : ~360 KB (JS) + ~22 KB (CSS)
- **Backend Rust** : ~8-10 MB
- **Total .exe** : ~10-12 MB (vs 100+ MB avec Electron)

---

## 🎯 Fonctionnalités Implémentées

### ✅ Complètes

- [X] UI moderne avec thème sombre/violet
- [X] Sidebar avec navigation
- [X] Dashboard avec statistiques en temps réel
- [X] Page Serveurs avec liste et gestion complète
- [X] Builders (Vanilla, Forge, NeoForge) - UI et fonctionnel
- [X] Terminal intégré avec logs en temps réel
- [X] Page Réseau avec support Playit.gg
- [X] Page Mods avec gestion et analyse de conflits
- [X] Page Paramètres avec personnalisation complète
- [X] Page Joueurs avec modération avancée
- [X] APIs Minecraft connectées (Mojang, Forge, NeoForge)
- [X] Multi-langue (Français/Anglais)
- [X] Animations Framer Motion
- [X] Téléchargement réel des JARs
- [X] Gestion processus Java
- [X] Création fichiers serveur
- [X] Logs en temps réel
- [X] Intégration Playit.gg CLI
- [X] System Tray Windows
- [X] Sauvegardes automatiques
- [X] Monitoring avancé (RAM, joueurs connectés)
- [X] Gestion des joueurs (ban, whitelist, OP, kick)
- [X] Skins Minecraft pour les joueurs
- [X] Site web de présentation
- [X] Page de statut des services

---

## 🐛 Dépannage

### "rustc not found"

**Cause** : Rust n'est pas installé
**Solution** : Installer depuis https://rustup.rs/ puis redémarrer le terminal

### "linker 'link.exe' not found"

**Cause** : Visual Studio Build Tools manquant
**Solution** : Installer depuis https://visualstudio.microsoft.com/downloads/

### "npm run tauri:dev" ne démarre pas

**Cause** : Rust ou Cargo non trouvé
**Solution** : Exécuter `.\check-requirements.ps1` pour diagnostiquer

### Erreur de compilation Rust

**Cause** : Cache corrompu
**Solution** : `cargo clean` puis relancer

---

## 📚 Documentation

- `API_GUIDE.md` - Documentation des APIs connectées (Mojang, Forge, NeoForge)
- `README.md` - Ce fichier (guide principal)

---

## 🤝 Contribution

Ce projet est en développement actif. Les contributions sont les bienvenues !

---

## 📄 Licence

MIT License - Voir `LICENSE` pour plus de détails

---

## 🎉 Statut du Projet

**Version** : 1.0.0
**État** : ✅ **Terminé et fonctionnel**
**Complétion** : 100% (UI + Backend + Site web)
**Prêt pour** : Utilisation en production
**Site web** : Disponible dans `Website/Nether Client WebSite/`

---

## 📞 Support

Pour toute question ou problème :

1. Vérifier `INSTALLATION_RAPIDE.md`
2. Exécuter `.\check-requirements.ps1`
3. Consulter la documentation Tauri : https://tauri.app/

---

**Développé avec ❤️ et ☕ pour la communauté Minecraft**
