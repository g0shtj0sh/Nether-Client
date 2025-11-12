# 🔌 Guide d'Utilisation des APIs - Nether Client

## ✅ Pas Besoin de .env !

Toutes les APIs utilisées sont **publiques** et ne nécessitent **aucune clé API** ni fichier `.env`. Les URLs sont directement intégrées dans le code.

---

## 📡 APIs Connectées

### 1. **API Mojang (Minecraft Vanilla)**

**URL:** `https://launchermeta.mojang.com/mc/game/version_manifest_v2.json`

**Utilisation:**
```typescript
import MinecraftAPI from './services/minecraftAPI';

// Récupérer toutes les versions
const versions = await MinecraftAPI.getVersions();

// Récupérer uniquement les releases
const releases = await MinecraftAPI.getReleaseVersions();

// Récupérer l'URL de téléchargement du server.jar
const downloadUrl = await MinecraftAPI.getServerDownloadUrl(versionUrl);
```

**Fonctionnalités:**
- ✅ Liste toutes les versions Minecraft (release, snapshot, beta, alpha)
- ✅ Récupère les détails d'une version spécifique
- ✅ Fournit l'URL de téléchargement du `server.jar`
- ✅ Filtre par type de version

---

### 2. **Maven Forge**

**URL:** `https://maven.minecraftforge.net/net/minecraftforge/forge/`

**Utilisation:**
```typescript
import ForgeAPI from './services/forgeAPI';

// Récupérer les versions Forge
const versions = await ForgeAPI.getVersions();

// Obtenir l'URL de l'installeur
const installerUrl = ForgeAPI.getInstallerUrl('1.20.1-47.2.0');

// Vérifier si une version existe
const exists = await ForgeAPI.versionExists('1.20.1-47.2.0');
```

**Fonctionnalités:**
- ✅ Liste les versions Forge disponibles
- ✅ Versions fallback si l'API ne répond pas
- ✅ URL de téléchargement de l'installeur
- ✅ Vérification d'existence d'une version

**Versions Incluses (Fallback):**
- 1.20.1-47.2.0
- 1.19.2-43.3.0
- 1.18.2-40.2.0
- 1.16.5-36.2.39
- 1.12.2-14.23.5.2859

---

### 3. **Maven NeoForge**

**URL:** `https://maven.neoforged.net/releases/net/neoforged/neoforge/`

**Utilisation:**
```typescript
import NeoForgeAPI from './services/neoforgeAPI';

// Récupérer les versions NeoForge
const versions = await NeoForgeAPI.getVersions();

// Obtenir l'URL de l'installeur
const installerUrl = NeoForgeAPI.getInstallerUrl('20.4.237-beta');

// Récupérer les versions pour une version Minecraft spécifique
const versionsFor120 = await NeoForgeAPI.getVersionsForMinecraft('1.20');
```

**Fonctionnalités:**
- ✅ Liste les versions NeoForge disponibles
- ✅ Versions fallback si l'API ne répond pas
- ✅ URL de téléchargement de l'installeur
- ✅ Filtrage par version Minecraft

**Versions Incluses (Fallback):**
- 20.4.237-beta
- 20.4.190
- 20.2.88
- 20.1.85

---

## 🔧 Configuration Centralisée

Toutes les URLs sont centralisées dans `src/config/api.ts` :

```typescript
export const API_CONFIG = {
  mojang: {
    versionManifest: 'https://launchermeta.mojang.com/mc/game/version_manifest_v2.json',
    baseUrl: 'https://launchermeta.mojang.com'
  },
  forge: {
    baseUrl: 'https://maven.minecraftforge.net',
    mavenUrl: 'https://maven.minecraftforge.net/net/minecraftforge/forge'
  },
  neoforge: {
    baseUrl: 'https://maven.neoforged.net',
    mavenUrl: 'https://maven.neoforged.net/releases/net/neoforged/neoforge'
  }
};
```

---

## 🚀 Utilisation dans les Builders

### JavaBuilder
```typescript
import MinecraftAPI from '../../services/minecraftAPI';

const fetchVersions = async () => {
  const allVersions = await MinecraftAPI.getVersions();
  const recentVersions = allVersions
    .filter(v => v.type === 'release' || v.type === 'snapshot')
    .slice(0, 50);
  setVersions(recentVersions);
};
```

### ForgeBuilder
```typescript
import ForgeAPI from '../../services/forgeAPI';

const fetchVersions = async () => {
  const forgeVersions = await ForgeAPI.getVersions();
  setVersions(forgeVersions);
};
```

### NeoForgeBuilder
```typescript
import NeoForgeAPI from '../../services/neoforgeAPI';

const fetchVersions = async () => {
  const neoforgeVersions = await NeoForgeAPI.getVersions();
  setVersions(neoforgeVersions);
};
```

---

## 🛡️ Gestion des Erreurs

Tous les services incluent une gestion d'erreurs robuste :

```typescript
try {
  const versions = await MinecraftAPI.getVersions();
} catch (error) {
  console.error('Erreur:', error);
  // Afficher un message à l'utilisateur
}
```

**Fonctionnalités de Sécurité:**
- ✅ Try/catch sur tous les appels API
- ✅ Messages d'erreur utilisateur-friendly
- ✅ Versions fallback si l'API ne répond pas
- ✅ Vérification de la connexion Internet

---

## 📦 Avantages de cette Approche

### ✅ Sans .env
- Pas de configuration supplémentaire
- Pas de variables d'environnement à gérer
- Fonctionne directement après installation

### ✅ Distribution .exe
- Tout est intégré dans l'exécutable
- Aucune configuration utilisateur requise
- Prêt à l'emploi

### ✅ APIs Publiques
- Aucune clé API nécessaire
- Aucune limite de requêtes (dans la limite du raisonnable)
- Gratuites et officielles

### ✅ Offline-First
- Versions fallback intégrées
- Continue de fonctionner si l'API est down
- Cache local possible

---

## 🔄 Flux de Données

```
┌─────────────────┐
│   Utilisateur   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Builder UI    │ (JavaBuilder, ForgeBuilder, NeoForgeBuilder)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Service API    │ (minecraftAPI, forgeAPI, neoforgeAPI)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Publique   │ (Mojang, Maven Forge, Maven NeoForge)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Versions      │ (Liste des versions disponibles)
└─────────────────┘
```

---

## 🧪 Test des APIs

Pour tester les APIs, lance simplement l'application :

```bash
npm run tauri:dev
```

Puis :
1. Clique sur "Nouveau Serveur"
2. Choisis un type (Vanilla, Forge, NeoForge)
3. Les versions se chargeront automatiquement depuis les APIs

---

## 📝 Notes Importantes

### Connexion Internet Requise
- ✅ Pour récupérer les versions
- ✅ Pour télécharger les JARs
- ⚠️ Pas de connexion = Versions fallback utilisées

### Cache Recommandé
Pour améliorer les performances, tu peux implémenter un cache :
```typescript
// Cache les versions pendant 1 heure
const CACHE_DURATION = 3600000; // 1 heure en ms
```

### Rate Limiting
Les APIs publiques n'ont pas de limite stricte, mais il est recommandé de :
- Ne pas faire plus de 10 requêtes/seconde
- Cacher les résultats
- Utiliser les versions fallback en cas d'erreur

---

## ✨ Résumé

**Tout est prêt !** Les APIs sont connectées et fonctionnelles :

- ✅ **Pas de .env nécessaire**
- ✅ **APIs publiques gratuites**
- ✅ **Intégration complète dans les builders**
- ✅ **Gestion d'erreurs robuste**
- ✅ **Versions fallback incluses**
- ✅ **Prêt pour distribution .exe**

**Lance `npm run tauri:dev` et teste !** 🚀
