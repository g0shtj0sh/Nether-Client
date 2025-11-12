// Configuration des APIs publiques (pas besoin de .env)
export const API_CONFIG = {
  // API Mojang pour Minecraft Vanilla
  mojang: {
    versionManifest: 'https://launchermeta.mojang.com/mc/game/version_manifest_v2.json',
    baseUrl: 'https://launchermeta.mojang.com'
  },
  
  // Maven Forge
  forge: {
    baseUrl: 'https://maven.minecraftforge.net',
    promotionsUrl: 'https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json',
    mavenUrl: 'https://maven.minecraftforge.net/net/minecraftforge/forge'
  },
  
  // Maven NeoForge
  neoforge: {
    baseUrl: 'https://maven.neoforged.net',
    mavenUrl: 'https://maven.neoforged.net/releases/net/neoforged/neoforge',
    versionsUrl: 'https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge'
  },
  
  // MohistMC
  mohist: {
    baseUrl: 'https://github.com/MohistMC/Mohist',
    downloadUrl: 'https://github.com/MohistMC/Mohist/releases/download',
    apiUrl: 'https://api.github.com/repos/MohistMC/Mohist/releases',
    // Dépôt GitHub de fallback pour les assets
    fallbackAssets: {
      baseUrl: 'https://raw.githubusercontent.com/g0shtj0sh/nether-client-resources/main',
      mohistPath: '/mohist-build-resource',
      versionsFile: '/mohist-build-resource/versions.json'
    }
  },
  
  // Playit.gg
  playit: {
    downloadUrl: 'https://playit.gg/downloads',
    cliWindows: 'https://github.com/playit-cloud/playit-agent/releases/latest/download/playit-windows-x86_64.exe'
  },
  
  // Chemins locaux (AppData)
  local: {
    appName: 'NetherClient',
    serversFolder: 'Serveurs',
    cacheFolder: 'cache',
    logsFolder: 'logs',
    configFile: 'config.json'
  },
  
  // Configuration par défaut
  DEFAULT_TIMEOUT: 30000,
  DEFAULT_HEADERS: {
    'User-Agent': 'NetherClient/1.0.0',
    'Accept': 'application/json',
  }
};

export default API_CONFIG;
