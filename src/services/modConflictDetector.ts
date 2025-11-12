// Système de détection de conflits entre mods

export interface ModInfo {
  name: string;
  fileName: string;
  modId?: string;
  version?: string;
  mcVersion?: string;
  dependencies?: string[];
  incompatibilities?: string[];
  loader: 'forge' | 'neoforge' | 'fabric' | 'quilt' | 'unknown';
}

export interface Conflict {
  type: 'incompatibility' | 'missing_dependency' | 'duplicate' | 'version_mismatch' | 'loader_incompatible';
  severity: 'error' | 'warning' | 'info';
  mod1: string;
  mod2?: string;
  message: string;
  suggestion?: string;
}

/**
 * Base de données des incompatibilités connues
 */
const KNOWN_INCOMPATIBILITIES: Record<string, string[]> = {
  'optifine': ['sodium', 'rubidium', 'embeddium'],
  'sodium': ['optifine', 'magnesium'],
  'rubidium': ['optifine', 'sodium'],
  'embeddium': ['optifine', 'sodium'],
  'iris': ['optifine'],
  'oculus': ['optifine', 'iris'],
  'create': ['botania'], // Conflit connu dans certaines versions
};

/**
 * Mods qui nécessitent des dépendances spécifiques
 */
const KNOWN_DEPENDENCIES: Record<string, string[]> = {
  'jei': ['forge', 'neoforge'],
  'rei': ['fabric'],
  'create': ['flywheel'],
  'botania': ['patchouli'],
  'thermal-expansion': ['cofh-core'],
  'mekanism': ['mekanism-generators'],
  'ae2': ['appliedenergistics2'],
  'refined-storage': ['refinedstorage'],
};

/**
 * Analyser le nom d'un fichier mod pour extraire les informations
 */
export function parseModFileName(fileName: string): ModInfo {
  const nameLower = fileName.toLowerCase().replace('.jar', '').replace('.disabled', '');
  
  // Détecter le loader
  let loader: ModInfo['loader'] = 'unknown';
  if (nameLower.includes('forge') || nameLower.includes('1.12') || nameLower.includes('1.16')) {
    loader = 'forge';
  } else if (nameLower.includes('neoforge')) {
    loader = 'neoforge';
  } else if (nameLower.includes('fabric')) {
    loader = 'fabric';
  } else if (nameLower.includes('quilt')) {
    loader = 'quilt';
  }

  // Extraire la version (pattern commun: nom-1.20.1-v1.0.0.jar)
  const versionMatch = nameLower.match(/(\d+\.\d+(?:\.\d+)?)/);
  const mcVersion = versionMatch ? versionMatch[1] : undefined;

  // Extraire l'ID du mod (généralement le premier mot avant le tiret)
  const modId = nameLower.split(/[-_]/)[0];

  return {
    name: fileName.replace('.jar', '').replace('.disabled', ''),
    fileName,
    modId,
    mcVersion,
    loader,
  };
}

/**
 * Détecter les conflits entre les mods
 */
export function detectConflicts(mods: ModInfo[], serverMcVersion: string, serverLoader: string): Conflict[] {
  const conflicts: Conflict[] = [];

  // 1. Détecter les duplicatas (même mod ID)
  const modIdCount = new Map<string, string[]>();
  mods.forEach(mod => {
    if (mod.modId) {
      if (!modIdCount.has(mod.modId)) {
        modIdCount.set(mod.modId, []);
      }
      modIdCount.get(mod.modId)!.push(mod.name);
    }
  });

  modIdCount.forEach((names, modId) => {
    if (names.length > 1) {
      conflicts.push({
        type: 'duplicate',
        severity: 'error',
        mod1: names[0],
        mod2: names[1],
        message: `Mod dupliqué détecté: ${modId}`,
        suggestion: `Supprimez l'une des versions: ${names.join(', ')}`,
      });
    }
  });

  // 2. Détecter les incompatibilités connues
  mods.forEach(mod1 => {
    if (mod1.modId && KNOWN_INCOMPATIBILITIES[mod1.modId]) {
      const incompatibleIds = KNOWN_INCOMPATIBILITIES[mod1.modId];
      
      mods.forEach(mod2 => {
        if (mod2.modId && incompatibleIds.includes(mod2.modId)) {
          conflicts.push({
            type: 'incompatibility',
            severity: 'error',
            mod1: mod1.name,
            mod2: mod2.name,
            message: `Incompatibilité détectée entre ${mod1.name} et ${mod2.name}`,
            suggestion: `Ces mods ne peuvent pas fonctionner ensemble. Désactivez l'un des deux.`,
          });
        }
      });
    }
  });

  // 3. Détecter les dépendances manquantes
  mods.forEach(mod => {
    if (mod.modId && KNOWN_DEPENDENCIES[mod.modId]) {
      const requiredDeps = KNOWN_DEPENDENCIES[mod.modId];
      
      requiredDeps.forEach(depId => {
        const hasDependency = mods.some(m => m.modId === depId);
        
        if (!hasDependency) {
          conflicts.push({
            type: 'missing_dependency',
            severity: 'warning',
            mod1: mod.name,
            message: `Dépendance manquante: ${depId}`,
            suggestion: `Installez ${depId} depuis le Marketplace pour que ${mod.name} fonctionne correctement.`,
          });
        }
      });
    }
  });

  // 4. Détecter les incompatibilités de version Minecraft
  mods.forEach(mod => {
    if (mod.mcVersion && serverMcVersion) {
      const modMajor = mod.mcVersion.split('.').slice(0, 2).join('.');
      const serverMajor = serverMcVersion.split('.').slice(0, 2).join('.');
      
      if (modMajor !== serverMajor) {
        conflicts.push({
          type: 'version_mismatch',
          severity: 'warning',
          mod1: mod.name,
          message: `Version incompatible: ${mod.name} est pour MC ${mod.mcVersion}, serveur en ${serverMcVersion}`,
          suggestion: `Téléchargez une version compatible depuis le Marketplace.`,
        });
      }
    }
  });

  // 5. Détecter les incompatibilités de loader
  mods.forEach(mod => {
    if (mod.loader !== 'unknown' && mod.loader !== serverLoader) {
      conflicts.push({
        type: 'loader_incompatible',
        severity: 'error',
        mod1: mod.name,
        message: `Loader incompatible: ${mod.name} est pour ${mod.loader}, serveur utilise ${serverLoader}`,
        suggestion: `Ce mod ne fonctionnera pas. Trouvez une version ${serverLoader} sur le Marketplace.`,
      });
    }
  });

  return conflicts;
}

/**
 * Générer un rapport de santé des mods
 */
export function generateModHealthReport(mods: ModInfo[], conflicts: Conflict[]): {
  totalMods: number;
  errors: number;
  warnings: number;
  info: number;
  healthScore: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
} {
  const errors = conflicts.filter(c => c.severity === 'error').length;
  const warnings = conflicts.filter(c => c.severity === 'warning').length;
  const info = conflicts.filter(c => c.severity === 'info').length;

  // Score de santé (0-100)
  const healthScore = Math.max(0, 100 - (errors * 20) - (warnings * 5));

  let status: 'excellent' | 'good' | 'warning' | 'critical';
  if (healthScore >= 90) status = 'excellent';
  else if (healthScore >= 70) status = 'good';
  else if (healthScore >= 40) status = 'warning';
  else status = 'critical';

  return {
    totalMods: mods.length,
    errors,
    warnings,
    info,
    healthScore,
    status,
  };
}

/**
 * Suggestions pour résoudre les conflits
 */
export function getSuggestionsForConflict(conflict: Conflict): string[] {
  const suggestions: string[] = [];

  switch (conflict.type) {
    case 'duplicate':
      suggestions.push('Gardez uniquement la version la plus récente');
      suggestions.push('Supprimez les anciennes versions pour éviter les conflits');
      break;

    case 'incompatibility':
      suggestions.push(`Désactivez ${conflict.mod1} ou ${conflict.mod2}`);
      suggestions.push('Consultez la documentation des mods pour plus d\'informations');
      break;

    case 'missing_dependency':
      suggestions.push('Installez la dépendance depuis le Marketplace');
      suggestions.push('Vérifiez la page du mod pour les dépendances requises');
      break;

    case 'version_mismatch':
      suggestions.push('Téléchargez la version correcte depuis le Marketplace');
      suggestions.push('Mettez à jour votre serveur à la version du mod');
      break;

    case 'loader_incompatible':
      suggestions.push('Trouvez une version compatible avec votre loader');
      suggestions.push('Changez le type de serveur si nécessaire');
      break;
  }

  if (conflict.suggestion) {
    suggestions.unshift(conflict.suggestion);
  }

  return suggestions;
}

/**
 * Obtenir une icône pour le type de conflit
 */
export function getConflictIcon(type: Conflict['type']): string {
  switch (type) {
    case 'incompatibility': return '⚠️';
    case 'missing_dependency': return '📦';
    case 'duplicate': return '🔄';
    case 'version_mismatch': return '🎮';
    case 'loader_incompatible': return '⚙️';
    default: return '❓';
  }
}

/**
 * Obtenir une couleur pour la sévérité
 */
export function getSeverityColor(severity: Conflict['severity']): string {
  switch (severity) {
    case 'error': return 'text-red-400';
    case 'warning': return 'text-yellow-400';
    case 'info': return 'text-blue-400';
    default: return 'text-gray-400';
  }
}

