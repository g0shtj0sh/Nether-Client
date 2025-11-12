export interface ServerProperties {
  whitelist: boolean;
  pvp: boolean;
  allowFlight: boolean;
  enableCommandBlock: boolean;
  spawnMonsters: boolean;
  allowNether: boolean;
  spawnProtection: number;
  forceGamemode: boolean;
  onlineMode: boolean;
  resourcePack: string;
}

export interface Server {
  id: string;
  name: string;
  version: string;
  type: 'vanilla' | 'forge' | 'neoforge' | 'mohist';
  port: number;
  ram: number;
  motd: string;
  maxPlayers: number;
  difficulty: 'easy' | 'normal' | 'hard' | 'peaceful';
  gamemode: 'survival' | 'creative' | 'adventure' | 'spectator';
  whitelist: string[];
  ops: string[];
  bannedPlayers: string[];
  bannedIPs: string[];
  status: 'stopped' | 'starting' | 'running' | 'stopping' | 'error';
  uptime?: number;
  players?: Player[];
  path: string;
  createdAt: Date;
  lastStarted?: Date;
  properties?: ServerProperties;
}

export interface Player {
  name: string;
  uuid: string;
  online: boolean;
  lastSeen?: Date;
}

export interface ServerStats {
  ram: number;
  tps: number;
  players: number;
  maxPlayers: number;
}

export interface MinecraftVersion {
  id: string;
  type: 'release' | 'snapshot' | 'old_beta' | 'old_alpha';
  url: string;
  time: string;
  releaseTime: string;
}

export interface ForgeVersion {
  version: string;
  installer: string;
  universal: string;
  changelog: string;
}

export interface NeoForgeVersion {
  version: string;
  installer: string;
  universal: string;
  changelog: string;
}

export interface MohistVersion {
  version: string;
  installer: string;
  universal: string;
  changelog: string;
}

export interface AppConfig {
  language: 'fr' | 'en';
  theme: 'dark' | 'light';
  javaPath?: string;
  defaultRam: number;
  cpuThreads?: number;
  autoBackup: boolean;
  backupInterval: number;
  playitEnabled: boolean;
  playitToken?: string;
}

export interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  serverId: string;
}

export interface Backup {
  id: string;
  serverId: string;
  name: string;
  path: string;
  size: number;
  createdAt: Date;
}
