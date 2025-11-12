// Système de traduction complet pour Nether Client

export interface Translation {
  // Sidebar
  sidebar: {
    title: string;
    subtitle: string;
    dashboard: string;
    servers: string;
    terminal: string;
    network: string;
    mods: string;
    settings: string;
    help: string;
  };
  
  // Dashboard
  dashboard: {
    title: string;
    subtitle: string;
    description: string;
    createdBy: string;
    activeServers: string;
    connectedPlayers: string;
    cpuUsage: string;
    ramUsage: string;
    tpsAverage: string;
    myServers: string;
    newServer: string;
    noServers: string;
    noServersDesc: string;
    recentActivity: string;
    noActivity: string;
    status: {
      running: string;
      starting: string;
      stopping: string;
      stopped: string;
      error: string;
    };
    folder: string;
    copy: string;
  };
  
  // Servers
  servers: {
    title: string;
    subtitle: string;
    createNew: string;
    vanilla: string;
    forge: string;
      neoforge: string;
      mohist: string;
      vanillaDesc: string;
      forgeDesc: string;
      neoforgeDesc: string;
      mohistDesc: string;
    serverName: string;
    serverNamePlaceholder: string;
    version: string;
    selectVersion: string;
    ram: string;
    port: string;
    maxPlayers: string;
    motd: string;
    motdPlaceholder: string;
    difficulty: string;
    gamemode: string;
    create: string;
    cancel: string;
    loading: string;
    loadingVersions: string;
    errorLoading: string;
    vanillaServer: string;
      forgeServer: string;
      neoforgeServer: string;
      mohistServer: string;
    running: string;
    starting: string;
    stopping: string;
    stopped: string;
    unknown: string;
    mode: string;
    players: string;
    start: string;
    stop: string;
    restart: string;
    folder: string;
    copy: string;
    noServers: string;
    noServersDesc: string;
    createVanilla: string;
    deleteConfirm: string;
    error: string;
    refresh: string;
    refreshDesc: string;
    scanning: string;
    newServersFound: string;
    noNewServers: string;
    difficulties: {
      peaceful: string;
      easy: string;
      normal: string;
      hard: string;
    };
    gamemodes: {
      survival: string;
      creative: string;
      adventure: string;
      spectator: string;
    };
  };
  
  // Terminal
  terminal: {
    title: string;
    subtitle: string;
    selectServer: string;
    noServers: string;
    enterCommand: string;
    send: string;
    clear: string;
    export: string;
    filter: string;
    all: string;
    info: string;
    warn: string;
    error: string;
    debug: string;
    autoScroll: string;
    commandPlaceholder: string;
    clearLogsConfirm: string;
    noLogs: string;
    total: string;
    searchLogs: string;
    showTimestamps: string;
    wordWrap: string;
    pause: string;
    resume: string;
    copy: string;
    downloadTxt: string;
    downloadCsv: string;
    delete: string;
    noLogsToDisplay: string;
    selectServerToViewLogs: string;
    commandHistoryHint: string;
    noRunningServers: string;
  };
  
  // Players
  players: {
    title: string;
    subtitle: string;
    server: string;
    selectServer: string;
    moderation: string;
    whitelist: string;
    operators: string;
    banned: string;
    playerName: string;
    add: string;
    searchPlayer: string;
    noPlayersFound: string;
    noSearchResults: string;
    addPlayersTo: string;
    authorizedToJoin: string;
    serverOperator: string;
    bannedFromServer: string;
    selectServerToManage: string;
    removeConfirm: string;
    playerAlreadyInList: string;
  };
  
  // Network
  network: {
    title: string;
    subtitle: string;
    playitTitle: string;
    playitDesc: string;
    status: string;
    statusActive: string;
    statusInactive: string;
    publicIP: string;
    notConfigured: string;
    configure: string;
    stop: string;
    tutorial: string;
    tutorialTitle: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    alternatives: string;
    alternativesDesc: string;
    ngrok: string;
    hamachi: string;
    portForwarding: string;
    installed: string;
    notInstalled: string;
    installPlayit: string;
    installing: string;
    tunnelStatus: string;
    active: string;
    inactive: string;
    tunnelUrl: string;
    startTunnel: string;
    stopTunnel: string;
    freeSecureTunnel: string;
    playitDescription: string;
    alternativesFree: string;
    alternativesSolutions: string;
    ngrokDesc: string;
    localTunnelDesc: string;
    serveoDesc: string;
    availableServers: string;
    serversCount: string;
    noServersCreated: string;
    noServersDesc: string;
    port: string;
    statusLabel: string;
    running: string;
    stopped: string;
    type: string;
    usageGuide: string;
    guideStep1Title: string;
    guideStep1Desc: string;
    guideStep2Title: string;
    guideStep2Desc: string;
    guideStep3Title: string;
    guideStep3Desc: string;
    guideStep4Title: string;
    guideStep4Desc: string;
  };
  
  // Mods
  mods: {
    title: string;
    subtitle: string;
    selectServer: string;
    noServers: string;
    noModdedServers: string;
    addMod: string;
    import: string;
    export: string;
    noMods: string;
    noModsDesc: string;
    enabled: string;
    disabled: string;
    version: string;
    size: string;
    delete: string;
    searchPlaceholder: string;
    allLoaders: string;
    all: string;
    enabledMods: string;
    disabledMods: string;
    noServerSelected: string;
    noServerSelectedDesc: string;
    vanillaServer: string;
    vanillaServerDesc: string;
    vanillaServerTip: string;
    modsCount: string;
    enabledCount: string;
    disabledCount: string;
    addMods: string;
    noModsFound: string;
    noModsSearch: string;
    noModsInstalled: string;
    compatibleWith: string;
    manuallyAdded: string;
    refreshMods: string;
    deleteConfirm: string;
  };
  
  // Settings
  settings: {
    title: string;
    subtitle: string;
    general: string;
    performance: string;
    storage: string;
    backup: string;
    system: string;
    
    // General
    language: string;
    languageDesc: string;
    french: string;
    english: string;
    defaultRam: string;
    defaultRamDesc: string;
    availableRam: string;
    autoStart: string;
    autoStartDesc: string;
    notifications: string;
    notificationsDesc: string;
    
    // Performance
    javaPath: string;
    javaPathDesc: string;
    autoDetect: string;
    browse: string;
    detected: string;
    cpuThreads: string;
    cpuThreadsDesc: string;
    availableThreads: string;
    gcOptimization: string;
    gcOptimizationDesc: string;
    
    // Storage
    installDir: string;
    installDirDesc: string;
    openFolder: string;
    totalSpace: string;
    usedSpace: string;
    freeSpace: string;
    cacheSize: string;
    clearCache: string;
    
    // Backup
    autoBackup: string;
    autoBackupDesc: string;
    backupFrequency: string;
    daily: string;
    weekly: string;
    monthly: string;
    backupLocation: string;
    createBackup: string;
    restoreBackup: string;
    
    // System
    systemInfo: string;
    os: string;
    cpu: string;
    totalRam: string;
    architecture: string;
    appVersion: string;
    checkUpdates: string;
    resetSettings: string;
    resetConfirm: string;
    
    // Appearance
    appearance: string;
    colorTheme: string;
    colorThemeDesc: string;
    themePreview: string;
    activeTheme: string;
    primaryButton: string;
    secondaryButton: string;
    exampleCard: string;
    exampleCardDesc: string;
    netherTheme: string;
    netherThemeDesc: string;
    endTheme: string;
    endThemeDesc: string;
    overworldTheme: string;
    overworldThemeDesc: string;
  };
  
  // Help
  help: {
    title: string;
    subtitle: string;
    gettingStarted: string;
    createServer: string;
    manageServer: string;
    terminal: string;
    network: string;
    voiceChat: string;
    mods: string;
    troubleshooting: string;
    
    // Getting Started
    gettingStartedContent: {
      title: string;
      welcome: string;
      step1Title: string;
      step1Desc: string;
      step2Title: string;
      step2Desc: string;
      step3Title: string;
      step3Desc: string;
    };
    
    // Create Server
    createServerContent: {
      title: string;
      intro: string;
      vanillaTitle: string;
      vanillaDesc: string;
      forgeTitle: string;
      forgeDesc: string;
      neoforgeTitle: string;
      neoforgeDesc: string;
    };
    
    // Manage Server
    manageServerContent: {
      title: string;
      startStop: string;
      startStopDesc: string;
      configure: string;
      configureDesc: string;
      whitelist: string;
      whitelistDesc: string;
    };
    
    // Terminal
    terminalContent: {
      title: string;
      intro: string;
      commands: string;
      stopCmd: string;
      stopDesc: string;
      opCmd: string;
      opDesc: string;
      whitelistCmd: string;
      whitelistDesc: string;
      sayCmd: string;
      sayDesc: string;
    };
    
    // Network
    networkContent: {
      title: string;
      intro: string;
      playitTitle: string;
      playitStep1: string;
      playitStep2: string;
      playitStep3: string;
      playitStep4: string;
      alternativesTitle: string;
      alternativesDesc: string;
    };
    
    // Voice Chat
    voiceChatContent: {
      title: string;
      intro: string;
      videoDescription: string;
    };
    
    // Mods
    modsContent: {
      title: string;
      intro: string;
      addModTitle: string;
      addModDesc: string;
      compatibilityTitle: string;
      compatibilityDesc: string;
      troubleshootTitle: string;
      troubleshootDesc: string;
    };
    
    // Troubleshooting
    troubleshootingContent: {
      title: string;
      issue1: string;
      solution1: string;
      issue2: string;
      solution2: string;
      issue3: string;
      solution3: string;
    };
  };
  
  // Common
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    close: string;
    confirm: string;
    yes: string;
    no: string;
    loading: string;
    error: string;
    success: string;
  };
}

export const translations: Record<'fr' | 'en', Translation> = {
  fr: {
    sidebar: {
      title: 'Nether Client',
      subtitle: 'Minecraft Server Manager',
      dashboard: 'Dashboard',
      servers: 'Serveurs',
      terminal: 'Terminal',
      network: 'Réseau',
      mods: 'Mods',
      settings: 'Paramètres',
      help: 'Aide',
    },
    
    dashboard: {
      title: 'Nether Client',
      subtitle: 'Dashboard',
      description: 'Gestionnaire de serveurs Minecraft professionnel. Créez, configurez et gérez vos serveurs Vanilla, Forge et NeoForge en toute simplicité.',
      createdBy: 'Créé par Josh Studio',
      activeServers: 'Serveurs Actifs',
      connectedPlayers: 'Joueurs Connectés',
      cpuUsage: 'Utilisation CPU',
      ramUsage: 'Utilisation RAM',
      tpsAverage: 'TPS Moyen',
      myServers: 'Mes Serveurs',
      newServer: 'Nouveau',
      noServers: 'Aucun serveur créé',
      noServersDesc: 'Créez votre premier serveur Minecraft',
      recentActivity: 'Activité Récente',
      noActivity: 'Aucune activité pour le moment',
      status: {
        running: 'En cours',
        starting: 'Démarrage...',
        stopping: 'Arrêt...',
        stopped: 'Arrêté',
        error: 'Erreur',
      },
      folder: 'Dossier',
      copy: 'Copier',
    },
    
    servers: {
      title: 'Serveurs',
      subtitle: 'Créer et gérer vos serveurs Minecraft',
      createNew: 'Créer un nouveau serveur',
      vanilla: 'Vanilla',
      forge: 'Forge',
      neoforge: 'NeoForge',
      mohist: 'MohistMC',
      vanillaDesc: 'Serveur Minecraft officiel sans mods',
      forgeDesc: 'Serveur moddé avec Forge Mod Loader',
      neoforgeDesc: 'Serveur moddé avec NeoForge (fork de Forge)',
      mohistDesc: 'Serveur hybride Forge + Bukkit/Spigot',
      serverName: 'Nom du serveur',
      serverNamePlaceholder: 'Mon Serveur Minecraft',
      version: 'Version',
      selectVersion: 'Sélectionner une version',
      ram: 'RAM (MB)',
      port: 'Port',
      maxPlayers: 'Joueurs max',
      motd: 'Message du jour (MOTD)',
      motdPlaceholder: 'Bienvenue sur mon serveur !',
      difficulty: 'Difficulté',
      gamemode: 'Mode de jeu',
      create: 'Créer le serveur',
      cancel: 'Annuler',
      loading: 'Création en cours...',
      loadingVersions: 'Chargement des versions...',
      errorLoading: 'Erreur lors du chargement des versions',
      vanillaServer: 'Serveur Vanilla',
      forgeServer: 'Serveur Forge',
      neoforgeServer: 'Serveur NeoForge',
      mohistServer: 'Serveur MohistMC',
      running: 'En cours',
      starting: 'Démarrage...',
      stopping: 'Arrêt...',
      stopped: 'Arrêté',
      unknown: 'Inconnu',
      mode: 'Mode',
      players: 'joueurs',
      start: 'Démarrer',
      stop: 'Arrêter',
      restart: 'Redémarrer',
      folder: 'Dossier',
      copy: 'Copier',
      noServers: 'Aucun serveur créé',
      noServersDesc: 'Créez votre premier serveur Minecraft en utilisant les boutons ci-dessus',
      createVanilla: 'Créer un serveur Vanilla',
      deleteConfirm: 'Êtes-vous sûr de vouloir supprimer ce serveur ?',
      error: 'Erreur',
      refresh: 'Actualiser',
      refreshDesc: 'Scanner le dossier des serveurs pour détecter les serveurs importés manuellement',
      scanning: 'Scan en cours...',
      newServersFound: 'Nouveau(x) serveur(s) détecté(s) et ajouté(s) !',
      noNewServers: 'Aucun nouveau serveur détecté',
      difficulties: {
        peaceful: 'Paisible',
        easy: 'Facile',
        normal: 'Normal',
        hard: 'Difficile',
      },
      gamemodes: {
        survival: 'Survie',
        creative: 'Créatif',
        adventure: 'Aventure',
        spectator: 'Spectateur',
      },
    },
    
    terminal: {
      title: 'Terminal',
      subtitle: 'Console et logs des serveurs',
      selectServer: 'Sélectionner un serveur',
      noServers: 'Aucun serveur disponible',
      enterCommand: 'Entrez une commande...',
      send: 'Envoyer',
      clear: 'Effacer',
      export: 'Exporter',
      filter: 'Filtrer',
      all: 'Tous',
      info: 'Info',
      warn: 'Avert.',
      error: 'Erreur',
      debug: 'Debug',
      autoScroll: 'Défilement auto',
      commandPlaceholder: 'Tapez une commande...',
      clearLogsConfirm: 'Êtes-vous sûr de vouloir effacer tous les logs ?',
      noLogs: 'Aucun log disponible',
      total: 'Total',
      searchLogs: 'Rechercher dans les logs...',
      showTimestamps: 'Afficher les timestamps',
      wordWrap: 'Retour à la ligne',
      pause: 'Pause',
      resume: 'Reprendre',
      copy: 'Copier',
      downloadTxt: 'Télécharger TXT',
      downloadCsv: 'Télécharger CSV',
      delete: 'Effacer',
      noLogsToDisplay: 'Aucun log à afficher',
      selectServerToViewLogs: 'Sélectionnez un serveur pour voir les logs',
      commandHistoryHint: 'pour naviguer dans l\'historique des commandes',
      noRunningServers: 'Aucun serveur en ligne disponible',
    },
    
    players: {
      title: 'Gestion des Joueurs',
      subtitle: 'Gérez la whitelist, les opérateurs et les bannissements',
      server: 'Serveur',
      selectServer: 'Sélectionner un serveur',
      moderation: 'Modération',
      whitelist: 'Whitelist',
      operators: 'Opérateurs',
      banned: 'Bannis',
      playerName: 'Nom du joueur (ex: Steve)',
      add: 'Ajouter',
      searchPlayer: 'Rechercher un joueur...',
      noPlayersFound: 'Aucun joueur trouvé',
      noSearchResults: 'Aucun résultat pour cette recherche',
      addPlayersTo: 'Ajoutez des joueurs à la',
      authorizedToJoin: 'Autorisé à rejoindre',
      serverOperator: 'Opérateur du serveur',
      bannedFromServer: 'Banni du serveur',
      selectServerToManage: 'Sélectionnez un serveur pour gérer les joueurs',
      removeConfirm: 'Êtes-vous sûr de vouloir retirer "{player}" de cette liste ?',
      playerAlreadyInList: 'Le joueur "{player}" est déjà dans cette liste',
    },
    
    network: {
      title: 'Réseau et Tunnels',
      subtitle: 'Rendez vos serveurs accessibles publiquement',
      playitTitle: 'Playit.gg',
      playitDesc: 'Rendez votre serveur accessible publiquement sans configuration de routeur',
      status: 'Statut',
      statusActive: 'Actif',
      statusInactive: 'Inactif',
      publicIP: 'IP Publique',
      notConfigured: 'Non configuré',
      configure: 'Configurer',
      stop: 'Arrêter',
      tutorial: 'Tutoriel',
      tutorialTitle: 'Configuration Playit.gg',
      step1: '1. Créez un compte gratuit sur playit.gg',
      step2: '2. Téléchargez et installez le client Playit.gg',
      step3: '3. Connectez-vous et créez un tunnel TCP',
      step4: '4. Configurez le port de votre serveur Minecraft',
      alternatives: 'Alternatives',
      alternativesDesc: 'Autres solutions pour héberger votre serveur',
      ngrok: 'Ngrok - Tunnel HTTP/TCP',
      hamachi: 'Hamachi - VPN privé',
      portForwarding: 'Port Forwarding - Configuration routeur',
      installed: 'Installé',
      notInstalled: 'Non installé',
      installPlayit: 'Installer Playit.gg',
      installing: 'Installation...',
      tunnelStatus: 'Statut du tunnel',
      active: 'Actif',
      inactive: 'Inactif',
      tunnelUrl: 'URL du tunnel',
      startTunnel: 'Démarrer le tunnel',
      stopTunnel: 'Arrêter le tunnel',
      freeSecureTunnel: 'Tunnel gratuit et sécurisé',
      playitDescription: 'Playit.gg permet de créer des tunnels gratuits pour rendre vos serveurs Minecraft accessibles depuis Internet.',
      alternativesFree: 'Alternatives gratuites',
      alternativesSolutions: 'Autres solutions de tunneling',
      ngrokDesc: 'Tunnel sécurisé avec limite de bande passante',
      localTunnelDesc: 'Solution simple et rapide',
      serveoDesc: 'Tunnel SSH gratuit',
      availableServers: 'Serveurs disponibles',
      serversCount: 'serveur(s)',
      noServersCreated: 'Aucun serveur créé',
      noServersDesc: 'Créez un serveur pour pouvoir le rendre accessible publiquement',
      port: 'Port',
      statusLabel: 'Statut',
      running: 'En cours',
      stopped: 'Arrêté',
      type: 'Type',
      usageGuide: 'Guide d\'utilisation',
      guideStep1Title: '1. Installation de Playit.gg',
      guideStep1Desc: 'Cliquez sur "Installer Playit.gg" pour télécharger et installer automatiquement le client.',
      guideStep2Title: '2. Configuration du tunnel',
      guideStep2Desc: 'Une fois installé, vous pouvez démarrer un tunnel pour rendre votre serveur accessible publiquement.',
      guideStep3Title: '3. Partage de l\'URL',
      guideStep3Desc: 'L\'URL générée peut être partagée avec vos amis pour qu\'ils puissent rejoindre votre serveur.',
      guideStep4Title: '4. Sécurité',
      guideStep4Desc: 'Les tunnels Playit.gg sont sécurisés et chiffrés. Vous pouvez configurer des mots de passe pour protéger vos serveurs.',
    },
    
    mods: {
      title: 'Gestion des Mods',
      subtitle: 'Gérez les mods de vos serveurs',
      selectServer: 'Sélectionner un serveur',
      noServers: 'Aucun serveur disponible',
      noModdedServers: 'Aucun serveur moddé disponible',
      addMod: 'Ajouter un mod',
      import: 'Importer',
      export: 'Exporter',
      noMods: 'Aucun mod installé',
      noModsDesc: 'Ajoutez des mods pour personnaliser votre serveur',
      enabled: 'Activé',
      disabled: 'Désactivé',
      version: 'Version',
      size: 'Taille',
      delete: 'Supprimer',
      searchPlaceholder: 'Rechercher un mod...',
      allLoaders: 'Tous les loaders',
      all: 'Tous',
      enabledMods: 'Activés',
      disabledMods: 'Désactivés',
      noServerSelected: 'Aucun serveur sélectionné',
      noServerSelectedDesc: 'Sélectionnez un serveur moddé pour gérer ses mods',
      vanillaServer: 'Serveur Vanilla',
      vanillaServerDesc: 'Ce serveur ne supporte pas les mods',
      vanillaServerTip: 'Créez un serveur Forge ou NeoForge pour utiliser des mods',
      modsCount: 'Mods',
      enabledCount: 'Activés',
      disabledCount: 'Désactivés',
      addMods: 'Ajouter des mods',
      noModsFound: 'Aucun mod trouvé',
      noModsSearch: 'Aucun mod ne correspond à votre recherche',
      noModsInstalled: 'Aucun mod installé sur ce serveur',
      compatibleWith: 'Compatible avec',
      manuallyAdded: 'Mod ajouté manuellement',
      refreshMods: 'Rafraîchissement des mods...',
      deleteConfirm: 'Êtes-vous sûr de vouloir supprimer ce mod ?',
    },
    
    settings: {
      title: 'Paramètres',
      subtitle: 'Configuration de l\'application',
      general: 'Général',
      appearance: 'Apparence',
      performance: 'Performance',
      storage: 'Stockage',
      backup: 'Sauvegarde',
      system: 'Système',
      
      language: 'Langue',
      languageDesc: 'Choisissez la langue de l\'interface',
      french: 'Français',
      english: 'English',
      defaultRam: 'RAM par défaut',
      defaultRamDesc: 'RAM allouée par défaut aux nouveaux serveurs',
      availableRam: 'RAM disponible',
      autoStart: 'Démarrage automatique',
      autoStartDesc: 'Lancer l\'application au démarrage de Windows',
      notifications: 'Notifications',
      notificationsDesc: 'Afficher les notifications système',
      
      javaPath: 'Chemin Java',
      javaPathDesc: 'Emplacement de l\'exécutable Java',
      autoDetect: 'Détection automatique',
      browse: 'Parcourir',
      detected: 'Détecté',
      cpuThreads: 'Threads CPU',
      cpuThreadsDesc: 'Nombre de threads alloués aux serveurs',
      availableThreads: 'Threads disponibles',
      gcOptimization: 'Optimisation GC',
      gcOptimizationDesc: 'Activer les optimisations du Garbage Collector Java',
      
      installDir: 'Dossier d\'installation',
      installDirDesc: 'Emplacement des serveurs et fichiers',
      openFolder: 'Ouvrir le dossier',
      totalSpace: 'Espace total',
      usedSpace: 'Espace utilisé',
      freeSpace: 'Espace libre',
      cacheSize: 'Taille du cache',
      clearCache: 'Vider le cache',
      
      autoBackup: 'Sauvegarde automatique',
      autoBackupDesc: 'Créer des sauvegardes automatiques des serveurs',
      backupFrequency: 'Fréquence',
      daily: 'Quotidienne',
      weekly: 'Hebdomadaire',
      monthly: 'Mensuelle',
      backupLocation: 'Emplacement des sauvegardes',
      createBackup: 'Créer une sauvegarde',
      restoreBackup: 'Restaurer une sauvegarde',
      
      systemInfo: 'Informations système',
      os: 'Système d\'exploitation',
      cpu: 'Processeur',
      totalRam: 'RAM totale',
      architecture: 'Architecture',
      appVersion: 'Version de l\'application',
      checkUpdates: 'Vérifier les mises à jour',
      resetSettings: 'Réinitialiser les paramètres',
      resetConfirm: 'Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?',
      
      // Appearance
      colorTheme: 'Thème de couleur',
      colorThemeDesc: 'Choisissez le thème qui correspond le mieux à vos préférences',
      themePreview: 'Aperçu du thème',
      activeTheme: '✓ Actif',
      primaryButton: 'Bouton Principal',
      secondaryButton: 'Bouton Secondaire',
      exampleCard: 'Exemple de carte avec accent coloré',
      exampleCardDesc: 'Ceci est un exemple de comment les couleurs s\'appliquent aux différents éléments',
      netherTheme: 'Nether',
      netherThemeDesc: 'Thème rouge et orange inspiré du Nether',
      endTheme: 'End',
      endThemeDesc: 'Thème violet et rose inspiré de l\'End',
      overworldTheme: 'Overworld',
      overworldThemeDesc: 'Thème vert et bleu inspiré de l\'Overworld',
    },
    
    help: {
      title: 'Aide',
      subtitle: 'Documentation et support',
      gettingStarted: 'Premiers pas',
      createServer: 'Créer un serveur',
      manageServer: 'Gérer un serveur',
      terminal: 'Terminal',
      network: 'Réseau',
      voiceChat: 'Voice Chat',
      mods: 'Mods',
      troubleshooting: 'Dépannage',
      
      gettingStartedContent: {
        title: 'Bienvenue sur Nether Client',
        welcome: 'Nether Client est un gestionnaire de serveurs Minecraft complet qui vous permet de créer, configurer et gérer facilement vos serveurs locaux.',
        step1Title: 'Étape 1 : Créer votre premier serveur',
        step1Desc: 'Rendez-vous dans la section "Serveurs" et choisissez le type de serveur que vous souhaitez créer (Vanilla, Forge ou NeoForge).',
        step2Title: 'Étape 2 : Configurer votre serveur',
        step2Desc: 'Définissez le nom, la version, la RAM allouée et les autres paramètres de votre serveur.',
        step3Title: 'Étape 3 : Lancer votre serveur',
        step3Desc: 'Une fois créé, vous pouvez démarrer votre serveur depuis le Dashboard et le gérer via le Terminal.',
      },
      
      createServerContent: {
        title: 'Créer un serveur Minecraft',
        intro: 'Nether Client supporte trois types de serveurs :',
        vanillaTitle: 'Serveur Vanilla',
        vanillaDesc: 'Un serveur Minecraft officiel sans modifications. Idéal pour une expérience pure du jeu.',
        forgeTitle: 'Serveur Forge',
        forgeDesc: 'Un serveur moddé utilisant Forge Mod Loader. Permet d\'installer des mods pour personnaliser l\'expérience de jeu.',
        neoforgeTitle: 'Serveur NeoForge',
        neoforgeDesc: 'Un serveur moddé utilisant NeoForge (fork moderne de Forge). Compatible avec la plupart des mods Forge récents.',
      },
      
      manageServerContent: {
        title: 'Gérer votre serveur',
        startStop: 'Démarrer / Arrêter',
        startStopDesc: 'Utilisez les boutons dans le Dashboard pour contrôler l\'état de vos serveurs.',
        configure: 'Configuration',
        configureDesc: 'Modifiez les paramètres du serveur (MOTD, difficulté, mode de jeu) depuis la page Serveurs.',
        whitelist: 'Whitelist et Opérateurs',
        whitelistDesc: 'Gérez les joueurs autorisés et les opérateurs depuis les paramètres du serveur.',
      },
      
      terminalContent: {
        title: 'Utiliser le Terminal',
        intro: 'Le terminal vous permet d\'envoyer des commandes directement à votre serveur Minecraft. Voici quelques commandes utiles :',
        commands: 'Commandes principales',
        stopCmd: '/stop',
        stopDesc: 'Arrête le serveur proprement',
        opCmd: '/op <joueur>',
        opDesc: 'Donne les permissions d\'opérateur à un joueur',
        whitelistCmd: '/whitelist add <joueur>',
        whitelistDesc: 'Ajoute un joueur à la whitelist',
        sayCmd: '/say <message>',
        sayDesc: 'Envoie un message à tous les joueurs',
      },
      
      networkContent: {
        title: 'Configuration Réseau',
        intro: 'Pour rendre votre serveur accessible en ligne, vous avez plusieurs options :',
        playitTitle: 'Playit.gg (Recommandé)',
        playitStep1: '1. Créez un compte gratuit sur playit.gg',
        playitStep2: '2. Téléchargez et installez le client Playit.gg',
        playitStep3: '3. Créez un tunnel TCP et configurez le port de votre serveur',
        playitStep4: '4. Partagez l\'adresse IP fournie par Playit.gg avec vos amis',
        alternativesTitle: 'Alternatives',
        alternativesDesc: 'Vous pouvez également utiliser Ngrok, Hamachi ou configurer le port forwarding sur votre routeur.',
      },
      
      voiceChatContent: {
        title: 'Configuration du Voice Chat',
        intro: 'Le voice chat permet aux joueurs de communiquer vocalement sur votre serveur Minecraft. Suivez ce tutoriel pour configurer le système de voice chat.',
        videoDescription: 'Regardez ce tutoriel vidéo pour apprendre à configurer le voice chat sur votre serveur étape par étape :',
      },
      
      modsContent: {
        title: 'Gestion des Mods',
        intro: 'Les mods permettent de personnaliser votre expérience Minecraft. Voici comment les gérer :',
        addModTitle: 'Ajouter un mod',
        addModDesc: 'Téléchargez le fichier .jar du mod depuis CurseForge ou Modrinth, puis utilisez le bouton "Ajouter un mod" dans la section Mods.',
        compatibilityTitle: 'Compatibilité',
        compatibilityDesc: 'Assurez-vous que le mod est compatible avec la version de Minecraft et le loader (Forge/NeoForge) de votre serveur.',
        troubleshootTitle: 'Dépannage',
        troubleshootDesc: 'Si un mod cause des problèmes, désactivez-le temporairement pour identifier la source du problème.',
      },
      
      troubleshootingContent: {
        title: 'Problèmes courants',
        issue1: 'Le serveur ne démarre pas',
        solution1: 'Vérifiez que Java est correctement installé et que vous avez alloué suffisamment de RAM au serveur.',
        issue2: 'Erreur "Cannot bind to port"',
        solution2: 'Le port est déjà utilisé par un autre programme. Changez le port du serveur ou fermez l\'autre programme.',
        issue3: 'Les joueurs ne peuvent pas se connecter',
        solution3: 'Vérifiez que le serveur est démarré, que le port est ouvert et que l\'adresse IP est correcte.',
      },
    },
    
    common: {
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      close: 'Fermer',
      confirm: 'Confirmer',
      yes: 'Oui',
      no: 'Non',
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
    },
  },
  
  en: {
    sidebar: {
      title: 'Nether Client',
      subtitle: 'Minecraft Server Manager',
      dashboard: 'Dashboard',
      servers: 'Servers',
      terminal: 'Terminal',
      network: 'Network',
      mods: 'Mods',
      settings: 'Settings',
      help: 'Help',
    },
    
    dashboard: {
      title: 'Nether Client',
      subtitle: 'Dashboard',
      description: 'Professional Minecraft server manager. Create, configure and manage your Vanilla, Forge and NeoForge servers with ease.',
      createdBy: 'Created by Josh Studio',
      activeServers: 'Active Servers',
      connectedPlayers: 'Connected Players',
      cpuUsage: 'CPU Usage',
      ramUsage: 'RAM Usage',
      tpsAverage: 'Average TPS',
      myServers: 'My Servers',
      newServer: 'New',
      noServers: 'No servers created',
      noServersDesc: 'Create your first Minecraft server',
      recentActivity: 'Recent Activity',
      noActivity: 'No activity at the moment',
      status: {
        running: 'Running',
        starting: 'Starting...',
        stopping: 'Stopping...',
        stopped: 'Stopped',
        error: 'Error',
      },
      folder: 'Folder',
      copy: 'Copy',
    },
    
    servers: {
      title: 'Servers',
      subtitle: 'Create and manage your Minecraft servers',
      createNew: 'Create a new server',
      vanilla: 'Vanilla',
      forge: 'Forge',
      neoforge: 'NeoForge',
      mohist: 'MohistMC',
      vanillaDesc: 'Official Minecraft server without mods',
      forgeDesc: 'Modded server with Forge Mod Loader',
      neoforgeDesc: 'Modded server with NeoForge (Forge fork)',
      mohistDesc: 'Hybrid server Forge + Bukkit/Spigot',
      serverName: 'Server name',
      serverNamePlaceholder: 'My Minecraft Server',
      version: 'Version',
      selectVersion: 'Select a version',
      ram: 'RAM (MB)',
      port: 'Port',
      maxPlayers: 'Max players',
      motd: 'Message of the day (MOTD)',
      motdPlaceholder: 'Welcome to my server!',
      difficulty: 'Difficulty',
      gamemode: 'Gamemode',
      create: 'Create server',
      cancel: 'Cancel',
      loading: 'Creating...',
      loadingVersions: 'Loading versions...',
      errorLoading: 'Error loading versions',
      vanillaServer: 'Vanilla Server',
      forgeServer: 'Forge Server',
      neoforgeServer: 'NeoForge Server',
      mohistServer: 'MohistMC Server',
      running: 'Running',
      starting: 'Starting...',
      stopping: 'Stopping...',
      stopped: 'Stopped',
      unknown: 'Unknown',
      mode: 'Mode',
      players: 'players',
      start: 'Start',
      stop: 'Stop',
      restart: 'Restart',
      folder: 'Folder',
      copy: 'Copy',
      noServers: 'No servers created',
      noServersDesc: 'Create your first Minecraft server using the buttons above',
      createVanilla: 'Create Vanilla Server',
      deleteConfirm: 'Are you sure you want to delete this server?',
      error: 'Error',
      refresh: 'Refresh',
      refreshDesc: 'Scan the servers directory to detect manually imported servers',
      scanning: 'Scanning...',
      newServersFound: 'New server(s) detected and added!',
      noNewServers: 'No new servers detected',
      difficulties: {
        peaceful: 'Peaceful',
        easy: 'Easy',
        normal: 'Normal',
        hard: 'Hard',
      },
      gamemodes: {
        survival: 'Survival',
        creative: 'Creative',
        adventure: 'Adventure',
        spectator: 'Spectator',
      },
    },
    
    terminal: {
      title: 'Terminal',
      subtitle: 'Server console and logs',
      selectServer: 'Select a server',
      noServers: 'No servers available',
      enterCommand: 'Enter a command...',
      send: 'Send',
      clear: 'Clear',
      export: 'Export',
      filter: 'Filter',
      all: 'All',
      info: 'Info',
      warn: 'Warn',
      error: 'Error',
      debug: 'Debug',
      autoScroll: 'Auto scroll',
      commandPlaceholder: 'Type a command...',
      clearLogsConfirm: 'Are you sure you want to clear all logs?',
      noLogs: 'No logs available',
      total: 'Total',
      searchLogs: 'Search in logs...',
      showTimestamps: 'Show timestamps',
      wordWrap: 'Word wrap',
      pause: 'Pause',
      resume: 'Resume',
      copy: 'Copy',
      downloadTxt: 'Download TXT',
      downloadCsv: 'Download CSV',
      delete: 'Delete',
      noLogsToDisplay: 'No logs to display',
      selectServerToViewLogs: 'Select a server to view logs',
      commandHistoryHint: 'to navigate through command history',
      noRunningServers: 'No running servers available',
    },
    
    players: {
      title: 'Player Management',
      subtitle: 'Manage whitelist, operators and bans',
      server: 'Server',
      selectServer: 'Select a server',
      moderation: 'Moderation',
      whitelist: 'Whitelist',
      operators: 'Operators',
      banned: 'Banned',
      playerName: 'Player name (e.g: Steve)',
      add: 'Add',
      searchPlayer: 'Search for a player...',
      noPlayersFound: 'No players found',
      noSearchResults: 'No results for this search',
      addPlayersTo: 'Add players to',
      authorizedToJoin: 'Authorized to join',
      serverOperator: 'Server operator',
      bannedFromServer: 'Banned from server',
      selectServerToManage: 'Select a server to manage players',
      removeConfirm: 'Are you sure you want to remove "{player}" from this list?',
      playerAlreadyInList: 'Player "{player}" is already in this list',
    },
    
    network: {
      title: 'Network and Tunnels',
      subtitle: 'Make your servers publicly accessible',
      playitTitle: 'Playit.gg',
      playitDesc: 'Make your server publicly accessible without router configuration',
      status: 'Status',
      statusActive: 'Active',
      statusInactive: 'Inactive',
      publicIP: 'Public IP',
      notConfigured: 'Not configured',
      configure: 'Configure',
      stop: 'Stop',
      tutorial: 'Tutorial',
      tutorialTitle: 'Playit.gg Configuration',
      step1: '1. Create a free account on playit.gg',
      step2: '2. Download and install the Playit.gg client',
      step3: '3. Log in and create a TCP tunnel',
      step4: '4. Configure your Minecraft server port',
      alternatives: 'Alternatives',
      alternativesDesc: 'Other solutions to host your server',
      ngrok: 'Ngrok - HTTP/TCP Tunnel',
      hamachi: 'Hamachi - Private VPN',
      portForwarding: 'Port Forwarding - Router configuration',
      installed: 'Installed',
      notInstalled: 'Not installed',
      installPlayit: 'Install Playit.gg',
      installing: 'Installing...',
      tunnelStatus: 'Tunnel status',
      active: 'Active',
      inactive: 'Inactive',
      tunnelUrl: 'Tunnel URL',
      startTunnel: 'Start tunnel',
      stopTunnel: 'Stop tunnel',
      freeSecureTunnel: 'Free and secure tunnel',
      playitDescription: 'Playit.gg allows you to create free tunnels to make your Minecraft servers accessible from the Internet.',
      alternativesFree: 'Free alternatives',
      alternativesSolutions: 'Other tunneling solutions',
      ngrokDesc: 'Secure tunnel with bandwidth limit',
      localTunnelDesc: 'Simple and fast solution',
      serveoDesc: 'Free SSH tunnel',
      availableServers: 'Available servers',
      serversCount: 'server(s)',
      noServersCreated: 'No servers created',
      noServersDesc: 'Create a server to make it publicly accessible',
      port: 'Port',
      statusLabel: 'Status',
      running: 'Running',
      stopped: 'Stopped',
      type: 'Type',
      usageGuide: 'Usage guide',
      guideStep1Title: '1. Installing Playit.gg',
      guideStep1Desc: 'Click "Install Playit.gg" to automatically download and install the client.',
      guideStep2Title: '2. Tunnel configuration',
      guideStep2Desc: 'Once installed, you can start a tunnel to make your server publicly accessible.',
      guideStep3Title: '3. Sharing the URL',
      guideStep3Desc: 'The generated URL can be shared with your friends so they can join your server.',
      guideStep4Title: '4. Security',
      guideStep4Desc: 'Playit.gg tunnels are secure and encrypted. You can configure passwords to protect your servers.',
    },
    
    mods: {
      title: 'Mod Management',
      subtitle: 'Manage your server mods',
      selectServer: 'Select a server',
      noServers: 'No servers available',
      noModdedServers: 'No modded servers available',
      addMod: 'Add a mod',
      import: 'Import',
      export: 'Export',
      noMods: 'No mods installed',
      noModsDesc: 'Add mods to customize your server',
      enabled: 'Enabled',
      disabled: 'Disabled',
      version: 'Version',
      size: 'Size',
      delete: 'Delete',
      searchPlaceholder: 'Search for a mod...',
      allLoaders: 'All loaders',
      all: 'All',
      enabledMods: 'Enabled',
      disabledMods: 'Disabled',
      noServerSelected: 'No server selected',
      noServerSelectedDesc: 'Select a modded server to manage its mods',
      vanillaServer: 'Vanilla Server',
      vanillaServerDesc: 'This server does not support mods',
      vanillaServerTip: 'Create a Forge or NeoForge server to use mods',
      modsCount: 'Mods',
      enabledCount: 'Enabled',
      disabledCount: 'Disabled',
      addMods: 'Add mods',
      noModsFound: 'No mods found',
      noModsSearch: 'No mods match your search',
      noModsInstalled: 'No mods installed on this server',
      compatibleWith: 'Compatible with',
      manuallyAdded: 'Manually added mod',
      refreshMods: 'Refreshing mods...',
      deleteConfirm: 'Are you sure you want to delete this mod?',
    },
    
    settings: {
      title: 'Settings',
      subtitle: 'Application configuration',
      general: 'General',
      appearance: 'Appearance',
      performance: 'Performance',
      storage: 'Storage',
      backup: 'Backup',
      system: 'System',
      
      language: 'Language',
      languageDesc: 'Choose the interface language',
      french: 'Français',
      english: 'English',
      defaultRam: 'Default RAM',
      defaultRamDesc: 'Default RAM allocated to new servers',
      availableRam: 'Available RAM',
      autoStart: 'Auto-start',
      autoStartDesc: 'Launch the application on Windows startup',
      notifications: 'Notifications',
      notificationsDesc: 'Show system notifications',
      
      javaPath: 'Java Path',
      javaPathDesc: 'Location of the Java executable',
      autoDetect: 'Auto-detect',
      browse: 'Browse',
      detected: 'Detected',
      cpuThreads: 'CPU Threads',
      cpuThreadsDesc: 'Number of threads allocated to servers',
      availableThreads: 'Available threads',
      gcOptimization: 'GC Optimization',
      gcOptimizationDesc: 'Enable Java Garbage Collector optimizations',
      
      installDir: 'Installation directory',
      installDirDesc: 'Location of servers and files',
      openFolder: 'Open folder',
      totalSpace: 'Total space',
      usedSpace: 'Used space',
      freeSpace: 'Free space',
      cacheSize: 'Cache size',
      clearCache: 'Clear cache',
      
      autoBackup: 'Automatic backup',
      autoBackupDesc: 'Create automatic server backups',
      backupFrequency: 'Frequency',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      backupLocation: 'Backup location',
      createBackup: 'Create backup',
      restoreBackup: 'Restore backup',
      
      systemInfo: 'System information',
      os: 'Operating system',
      cpu: 'Processor',
      totalRam: 'Total RAM',
      architecture: 'Architecture',
      appVersion: 'Application version',
      checkUpdates: 'Check for updates',
      resetSettings: 'Reset settings',
      resetConfirm: 'Are you sure you want to reset all settings?',
      
      // Appearance
      colorTheme: 'Color Theme',
      colorThemeDesc: 'Choose the theme that best matches your preferences',
      themePreview: 'Theme Preview',
      activeTheme: '✓ Active',
      primaryButton: 'Primary Button',
      secondaryButton: 'Secondary Button',
      exampleCard: 'Example card with colored accent',
      exampleCardDesc: 'This is an example of how colors apply to different elements',
      netherTheme: 'Nether',
      netherThemeDesc: 'Red and orange theme inspired by the Nether',
      endTheme: 'End',
      endThemeDesc: 'Purple and pink theme inspired by the End',
      overworldTheme: 'Overworld',
      overworldThemeDesc: 'Green and blue theme inspired by the Overworld',
    },
    
    help: {
      title: 'Help',
      subtitle: 'Documentation and support',
      gettingStarted: 'Getting Started',
      createServer: 'Create a Server',
      manageServer: 'Manage a Server',
      terminal: 'Terminal',
      network: 'Network',
      voiceChat: 'Voice Chat',
      mods: 'Mods',
      troubleshooting: 'Troubleshooting',
      
      gettingStartedContent: {
        title: 'Welcome to Nether Client',
        welcome: 'Nether Client is a complete Minecraft server manager that allows you to easily create, configure and manage your local servers.',
        step1Title: 'Step 1: Create your first server',
        step1Desc: 'Go to the "Servers" section and choose the type of server you want to create (Vanilla, Forge or NeoForge).',
        step2Title: 'Step 2: Configure your server',
        step2Desc: 'Set the name, version, allocated RAM and other parameters of your server.',
        step3Title: 'Step 3: Launch your server',
        step3Desc: 'Once created, you can start your server from the Dashboard and manage it via the Terminal.',
      },
      
      createServerContent: {
        title: 'Create a Minecraft Server',
        intro: 'Nether Client supports three types of servers:',
        vanillaTitle: 'Vanilla Server',
        vanillaDesc: 'An official Minecraft server without modifications. Ideal for a pure gaming experience.',
        forgeTitle: 'Forge Server',
        forgeDesc: 'A modded server using Forge Mod Loader. Allows you to install mods to customize the gaming experience.',
        neoforgeTitle: 'NeoForge Server',
        neoforgeDesc: 'A modded server using NeoForge (modern Forge fork). Compatible with most recent Forge mods.',
      },
      
      manageServerContent: {
        title: 'Manage Your Server',
        startStop: 'Start / Stop',
        startStopDesc: 'Use the buttons in the Dashboard to control the state of your servers.',
        configure: 'Configuration',
        configureDesc: 'Modify server settings (MOTD, difficulty, game mode) from the Servers page.',
        whitelist: 'Whitelist and Operators',
        whitelistDesc: 'Manage allowed players and operators from the server settings.',
      },
      
      terminalContent: {
        title: 'Using the Terminal',
        intro: 'The terminal allows you to send commands directly to your Minecraft server. Here are some useful commands:',
        commands: 'Main commands',
        stopCmd: '/stop',
        stopDesc: 'Stops the server properly',
        opCmd: '/op <player>',
        opDesc: 'Gives operator permissions to a player',
        whitelistCmd: '/whitelist add <player>',
        whitelistDesc: 'Adds a player to the whitelist',
        sayCmd: '/say <message>',
        sayDesc: 'Sends a message to all players',
      },
      
      networkContent: {
        title: 'Network Configuration',
        intro: 'To make your server accessible online, you have several options:',
        playitTitle: 'Playit.gg (Recommended)',
        playitStep1: '1. Create a free account on playit.gg',
        playitStep2: '2. Download and install the Playit.gg client',
        playitStep3: '3. Create a TCP tunnel and configure your server port',
        playitStep4: '4. Share the IP address provided by Playit.gg with your friends',
        alternativesTitle: 'Alternatives',
        alternativesDesc: 'You can also use Ngrok, Hamachi or configure port forwarding on your router.',
      },
      
      voiceChatContent: {
        title: 'Voice Chat Configuration',
        intro: 'Voice chat allows players to communicate vocally on your Minecraft server. Follow this tutorial to configure the voice chat system.',
        videoDescription: 'Watch this video tutorial to learn how to configure voice chat on your server step by step:',
      },
      
      modsContent: {
        title: 'Mods Management',
        intro: 'Mods allow you to customize your Minecraft experience. Here\'s how to manage them:',
        addModTitle: 'Add a mod',
        addModDesc: 'Download the mod\'s .jar file from CurseForge or Modrinth, then use the "Add a mod" button in the Mods section.',
        compatibilityTitle: 'Compatibility',
        compatibilityDesc: 'Make sure the mod is compatible with your server\'s Minecraft version and loader (Forge/NeoForge).',
        troubleshootTitle: 'Troubleshooting',
        troubleshootDesc: 'If a mod causes problems, temporarily disable it to identify the source of the problem.',
      },
      
      troubleshootingContent: {
        title: 'Common Issues',
        issue1: 'Server won\'t start',
        solution1: 'Check that Java is properly installed and that you have allocated enough RAM to the server.',
        issue2: 'Error "Cannot bind to port"',
        solution2: 'The port is already in use by another program. Change the server port or close the other program.',
        issue3: 'Players cannot connect',
        solution3: 'Check that the server is started, that the port is open and that the IP address is correct.',
      },
    },
    
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
    },
  },
};

export type Language = 'fr' | 'en';

export const getTranslation = (lang: Language): Translation => {
  return translations[lang] || translations.fr;
};

