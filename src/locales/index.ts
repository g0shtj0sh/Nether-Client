export const translations = {
  fr: {
    // Navigation
    nav: {
      dashboard: 'Tableau de bord',
      servers: 'Serveurs',
      terminal: 'Terminal',
      network: 'Réseau',
      mods: 'Mods',
      settings: 'Paramètres',
      help: 'Aide'
    },
    // Actions
    actions: {
      create: 'Créer',
      start: 'Démarrer',
      stop: 'Arrêter',
      restart: 'Redémarrer',
      delete: 'Supprimer',
      edit: 'Modifier',
      save: 'Sauvegarder',
      cancel: 'Annuler',
      download: 'Télécharger',
      upload: 'Téléverser',
      copy: 'Copier',
      export: 'Exporter',
      import: 'Importer'
    },
    // Status
    status: {
      running: 'En cours',
      stopped: 'Arrêté',
      starting: 'Démarrage...',
      stopping: 'Arrêt...',
      error: 'Erreur',
      online: 'En ligne',
      offline: 'Hors ligne'
    },
    // Server types
    serverTypes: {
      vanilla: 'Vanilla',
      forge: 'Forge',
      neoforge: 'NeoForge'
    },
    // Messages
    messages: {
      noServers: 'Aucun serveur créé',
      createFirstServer: 'Créez votre premier serveur Minecraft',
      serverCreated: 'Serveur créé avec succès !',
      serverDeleted: 'Serveur supprimé',
      confirmDelete: 'Êtes-vous sûr de vouloir supprimer ce serveur ?',
      loading: 'Chargement...',
      error: 'Une erreur est survenue'
    }
  },
  en: {
    // Navigation
    nav: {
      dashboard: 'Dashboard',
      servers: 'Servers',
      terminal: 'Terminal',
      network: 'Network',
      mods: 'Mods',
      settings: 'Settings',
      help: 'Help'
    },
    // Actions
    actions: {
      create: 'Create',
      start: 'Start',
      stop: 'Stop',
      restart: 'Restart',
      delete: 'Delete',
      edit: 'Edit',
      save: 'Save',
      cancel: 'Cancel',
      download: 'Download',
      upload: 'Upload',
      copy: 'Copy',
      export: 'Export',
      import: 'Import'
    },
    // Status
    status: {
      running: 'Running',
      stopped: 'Stopped',
      starting: 'Starting...',
      stopping: 'Stopping...',
      error: 'Error',
      online: 'Online',
      offline: 'Offline'
    },
    // Server types
    serverTypes: {
      vanilla: 'Vanilla',
      forge: 'Forge',
      neoforge: 'NeoForge'
    },
    // Messages
    messages: {
      noServers: 'No servers created',
      createFirstServer: 'Create your first Minecraft server',
      serverCreated: 'Server created successfully!',
      serverDeleted: 'Server deleted',
      confirmDelete: 'Are you sure you want to delete this server?',
      loading: 'Loading...',
      error: 'An error occurred'
    }
  }
};

export type Language = 'fr' | 'en';

export const useTranslation = (lang: Language = 'fr') => {
  return translations[lang];
};
