// Gestionnaire de profils de mods

export interface ModProfile {
  id: string;
  name: string;
  description: string;
  icon: string;
  mods: string[]; // Liste des noms de fichiers de mods
  createdAt: string;
  updatedAt: string;
  serverType: 'forge' | 'neoforge' | 'fabric';
  mcVersion: string;
  tags: string[];
}

/**
 * Charger les profils depuis localStorage
 */
export function loadProfiles(serverName: string): ModProfile[] {
  const key = `nether-mod-profiles-${serverName}`;
  const saved = localStorage.getItem(key);
  if (!saved) return [];
  
  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

/**
 * Sauvegarder les profils dans localStorage
 */
export function saveProfiles(serverName: string, profiles: ModProfile[]): void {
  const key = `nether-mod-profiles-${serverName}`;
  localStorage.setItem(key, JSON.stringify(profiles));
}

/**
 * Créer un nouveau profil
 */
export function createProfile(
  serverName: string,
  name: string,
  description: string,
  icon: string,
  mods: string[],
  serverType: 'forge' | 'neoforge' | 'fabric',
  mcVersion: string,
  tags: string[] = []
): ModProfile {
  const profile: ModProfile = {
    id: `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    icon,
    mods,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    serverType,
    mcVersion,
    tags,
  };

  const profiles = loadProfiles(serverName);
  profiles.push(profile);
  saveProfiles(serverName, profiles);

  return profile;
}

/**
 * Mettre à jour un profil
 */
export function updateProfile(
  serverName: string,
  profileId: string,
  updates: Partial<ModProfile>
): void {
  const profiles = loadProfiles(serverName);
  const index = profiles.findIndex(p => p.id === profileId);
  
  if (index !== -1) {
    profiles[index] = {
      ...profiles[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveProfiles(serverName, profiles);
  }
}

/**
 * Supprimer un profil
 */
export function deleteProfile(serverName: string, profileId: string): void {
  const profiles = loadProfiles(serverName);
  const filtered = profiles.filter(p => p.id !== profileId);
  saveProfiles(serverName, filtered);
}

/**
 * Dupliquer un profil
 */
export function duplicateProfile(serverName: string, profileId: string): ModProfile | null {
  const profiles = loadProfiles(serverName);
  const profile = profiles.find(p => p.id === profileId);
  
  if (!profile) return null;

  const newProfile: ModProfile = {
    ...profile,
    id: `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: `${profile.name} (Copie)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  profiles.push(newProfile);
  saveProfiles(serverName, profiles);

  return newProfile;
}

/**
 * Appliquer un profil (activer/désactiver les mods correspondants)
 */
export async function applyProfile(
  serverPath: string,
  profile: ModProfile
): Promise<void> {
  const { invoke } = await import('@tauri-apps/api/tauri');
  
  // Récupérer tous les mods du serveur
  const allMods: any[] = await invoke('list_server_mods', { serverPath });
  
  // Désactiver tous les mods
  for (const mod of allMods) {
    if (mod.enabled) {
      await invoke('toggle_mod', {
        serverPath,
        modName: mod.name,
        enabled: false,
      });
    }
  }
  
  // Activer uniquement les mods du profil
  for (const modName of profile.mods) {
    await invoke('toggle_mod', {
      serverPath,
      modName,
      enabled: true,
    });
  }
}

/**
 * Exporter un profil vers un fichier JSON
 */
export function exportProfile(profile: ModProfile): string {
  return JSON.stringify(profile, null, 2);
}

/**
 * Importer un profil depuis un fichier JSON
 */
export function importProfile(serverName: string, jsonString: string): ModProfile | null {
  try {
    const profile = JSON.parse(jsonString) as ModProfile;
    
    // Générer un nouvel ID et timestamps
    profile.id = `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    profile.createdAt = new Date().toISOString();
    profile.updatedAt = new Date().toISOString();
    
    const profiles = loadProfiles(serverName);
    profiles.push(profile);
    saveProfiles(serverName, profiles);
    
    return profile;
  } catch {
    return null;
  }
}

/**
 * Icônes disponibles pour les profils
 */
export const PROFILE_ICONS = [
  '🎮', '⚔️', '🏰', '🔥', '❄️', '⚡', '🌟', '💎',
  '🛡️', '🗡️', '🏹', '🪓', '⛏️', '🔨', '🧪', '📦',
  '🌍', '🌊', '🌋', '🏔️', '🌲', '🌵', '🍄', '🌸',
  '🐉', '🦇', '🕷️', '🐺', '🐷', '🐔', '🐄', '🐑',
  '🚀', '🎯', '🎨', '🎭', '🎪', '🎬', '🎵', '🎸',
  '💫', '✨', '🌈', '☄️', '🌙', '☀️', '⭐', '🔮',
];

/**
 * Tags prédéfinis
 */
export const PREDEFINED_TAGS = [
  'Vanilla+',
  'Tech',
  'Magic',
  'Adventure',
  'Exploration',
  'Building',
  'Performance',
  'Quality of Life',
  'Decorations',
  'Farming',
  'Combat',
  'RPG',
  'Hardcore',
  'Lightweight',
  'Heavy',
];

