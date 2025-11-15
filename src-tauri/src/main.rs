// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Command, Child, Stdio, ChildStdin};
use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use std::io::{BufReader, BufRead, Write};
use std::thread;
use serde::{Deserialize, Serialize};

mod automation;

// Structure pour stocker un processus serveur avec son stdin
struct ServerProcess {
    child: Child,
    stdin: Option<ChildStdin>,
}

// Gestionnaire global des processus serveurs
lazy_static::lazy_static! {
    static ref SERVER_PROCESSES: Arc<Mutex<HashMap<String, ServerProcess>>> = Arc::new(Mutex::new(HashMap::new()));
    static ref SERVER_LOGS: Arc<Mutex<HashMap<String, Vec<String>>>> = Arc::new(Mutex::new(HashMap::new()));
    static ref BACKUP_SCHEDULER: Arc<Mutex<Option<thread::JoinHandle<()>>>> = Arc::new(Mutex::new(None));
    static ref AUTO_BACKUP_ENABLED: Arc<Mutex<bool>> = Arc::new(Mutex::new(false));
    static ref AUTO_BACKUP_INTERVAL: Arc<Mutex<u64>> = Arc::new(Mutex::new(24)); // heures
    static ref AUTO_RESTART_ENABLED: Arc<Mutex<HashMap<String, bool>>> = Arc::new(Mutex::new(HashMap::new()));
    static ref SERVER_CRASH_COUNT: Arc<Mutex<HashMap<String, u32>>> = Arc::new(Mutex::new(HashMap::new()));
    static ref NEXT_AVAILABLE_PORT: Arc<Mutex<u16>> = Arc::new(Mutex::new(25565));
}

#[derive(Debug, Serialize, Deserialize)]
struct ServerConfig {
    name: String,
    version: String,
    port: u16,
    ram: u32,
    motd: String,
    max_players: u32,
    difficulty: String,
    gamemode: String,
    #[serde(default)]
    build: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
#[allow(dead_code)]
struct ServerStatus {
    id: String,
    name: String,
    status: String,
    port: u16,
    players: u32,
    max_players: u32,
    uptime: u64,
}

// Commande pour créer un serveur Vanilla
#[tauri::command]
async fn create_vanilla_server(config: ServerConfig) -> Result<String, String> {
    use std::env;
    use std::path::PathBuf;
    use std::fs;
    use std::io::Write;
    
    println!("Création du serveur Vanilla: {}", config.name);
    
    let server_id = format!("server_{}", chrono::Utc::now().timestamp());
    
    // Créer le dossier du serveur
    let app_data = env::var("APPDATA").map_err(|e| e.to_string())?;
    let server_path = PathBuf::from(&app_data)
        .join("NetherClient")
        .join("Serveurs")
        .join(&config.name);
    
    fs::create_dir_all(&server_path).map_err(|e| e.to_string())?;
    println!("Dossier créé: {}", server_path.display());
    
    // Télécharger le JAR Vanilla depuis Mojang
    println!("Téléchargement du serveur Minecraft {}...", config.version);
    
    // URL de l'API Mojang pour obtenir le lien de téléchargement
    let manifest_url = "https://launchermeta.mojang.com/mc/game/version_manifest_v2.json";
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(300))
        .build()
        .map_err(|e| e.to_string())?;
    
    // Récupérer le manifest
    let manifest: serde_json::Value = client
        .get(manifest_url)
        .send()
        .await
        .map_err(|e| format!("Erreur manifest: {}", e))?
        .json()
        .await
        .map_err(|e| format!("Erreur JSON manifest: {}", e))?;
    
    // Trouver la version
    let versions = manifest["versions"].as_array()
        .ok_or("Versions non trouvées")?;
    
    let version_data = versions.iter()
        .find(|v| v["id"].as_str() == Some(&config.version))
        .ok_or(format!("Version {} non trouvée", config.version))?;
    
    let version_url = version_data["url"].as_str()
        .ok_or("URL de version non trouvée")?;
    
    // Récupérer les détails de la version
    let version_details: serde_json::Value = client
        .get(version_url)
        .send()
        .await
        .map_err(|e| format!("Erreur détails: {}", e))?
        .json()
        .await
        .map_err(|e| format!("Erreur JSON détails: {}", e))?;
    
    let server_url = version_details["downloads"]["server"]["url"].as_str()
        .ok_or("URL du serveur non trouvée")?;
    
    println!("Téléchargement depuis: {}", server_url);
    
    // Télécharger le JAR
    let jar_bytes = client
        .get(server_url)
        .send()
        .await
        .map_err(|e| format!("Erreur téléchargement: {}", e))?
        .bytes()
        .await
        .map_err(|e| format!("Erreur lecture: {}", e))?;
    
    // Sauvegarder le JAR
    let jar_path = server_path.join("server.jar");
    let mut jar_file = fs::File::create(&jar_path)
        .map_err(|e| format!("Erreur création JAR: {}", e))?;
    jar_file.write_all(&jar_bytes)
        .map_err(|e| format!("Erreur écriture JAR: {}", e))?;
    
    println!("JAR téléchargé: {} octets", jar_bytes.len());
    
    // Créer eula.txt
    let eula_path = server_path.join("eula.txt");
    let mut eula_file = fs::File::create(&eula_path)
        .map_err(|e| format!("Erreur création EULA: {}", e))?;
    eula_file.write_all(b"eula=true\n")
        .map_err(|e| format!("Erreur écriture EULA: {}", e))?;
    
    // Créer server.properties
    let properties_content = format!(
        "server-port={}\n\
         max-players={}\n\
         motd={}\n\
         difficulty={}\n\
         gamemode={}\n\
         online-mode=true\n\
         pvp=true\n\
         spawn-protection=16\n\
         view-distance=10\n",
        config.port,
        config.max_players,
        config.motd,
        config.difficulty,
        config.gamemode
    );
    
    let properties_path = server_path.join("server.properties");
    let mut properties_file = fs::File::create(&properties_path)
        .map_err(|e| format!("Erreur création properties: {}", e))?;
    properties_file.write_all(properties_content.as_bytes())
        .map_err(|e| format!("Erreur écriture properties: {}", e))?;
    
    // Obtenir le chemin Java correct pour cette version Minecraft
    let java_path = get_java_executable_path(&config.version).await?;
    println!("Utilisation de Java: {}", java_path);
    
    // Créer le script de lancement .bat avec le bon chemin Java
    let ram_mb = config.ram;
    let ram_gb = ram_mb / 1024;
    let bat_content = format!(
        "@echo off\n\
         title Nether Client - {}\n\
         echo Demarrage du serveur {}...\n\
         echo Utilisation de Java: {}\n\
         \"{}\" -Xmx{}G -Xms{}G -jar server.jar nogui\n\
         pause\n",
        config.name,
        config.name,
        java_path,
        java_path,
        ram_gb,
        ram_gb / 2
    );
    
    let bat_path = server_path.join("start.bat");
    let mut bat_file = fs::File::create(&bat_path)
        .map_err(|e| format!("Erreur création BAT: {}", e))?;
    bat_file.write_all(bat_content.as_bytes())
        .map_err(|e| format!("Erreur écriture BAT: {}", e))?;
    
    println!("Serveur Vanilla créé avec succès!");
    
    Ok(server_id)
}

// Commande pour créer un serveur Forge
#[tauri::command]
async fn create_forge_server(config: ServerConfig) -> Result<String, String> {
    use std::env;
    use std::path::PathBuf;
    use std::fs;
    use std::io::Write;
    
    println!("Création du serveur Forge: {}", config.name);
    
    let server_id = format!("server_{}", chrono::Utc::now().timestamp());
    
    // Créer le dossier du serveur
    let app_data = env::var("APPDATA").map_err(|e| e.to_string())?;
    let server_path = PathBuf::from(&app_data)
        .join("NetherClient")
        .join("Serveurs")
        .join(&config.name);
    
    fs::create_dir_all(&server_path).map_err(|e| e.to_string())?;
    println!("Dossier créé: {}", server_path.display());
    
    // Télécharger l'installeur Forge
    println!("Téléchargement de Forge {}...", config.version);
    
    let forge_url = format!(
        "https://maven.minecraftforge.net/net/minecraftforge/forge/{}/forge-{}-installer.jar",
        config.version, config.version
    );
    
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(300))
        .build()
        .map_err(|e| e.to_string())?;
    
    let installer_bytes = client
        .get(&forge_url)
        .send()
        .await
        .map_err(|e| format!("Erreur téléchargement Forge: {}", e))?
        .bytes()
        .await
        .map_err(|e| format!("Erreur lecture Forge: {}", e))?;
    
    let installer_path = server_path.join("forge-installer.jar");
    let mut installer_file = fs::File::create(&installer_path)
        .map_err(|e| format!("Erreur création installer: {}", e))?;
    installer_file.write_all(&installer_bytes)
        .map_err(|e| format!("Erreur écriture installer: {}", e))?;
    
    println!("Installeur Forge téléchargé: {} octets", installer_bytes.len());
    
    // Obtenir le chemin Java correct pour cette version Minecraft
    let java_path = get_java_executable_path(&config.version).await?;
    println!("Utilisation de Java: {}", java_path);
    
    // Vérifier que le fichier Java existe
    if !std::path::Path::new(&java_path).exists() {
        return Err(format!("Le fichier Java n'existe pas: {}. Veuillez installer Java ou vérifier votre installation.", java_path));
    }
    
    // Exécuter l'installeur Forge
    println!("Installation de Forge...");
    let install_output = Command::new(&java_path)
        .args(["-jar", "forge-installer.jar", "--installServer"])
        .current_dir(&server_path)
        .output()
        .map_err(|e| format!("Erreur installation Forge: {}. Chemin Java utilisé: {}", e, java_path))?;
    
    if !install_output.status.success() {
        return Err(format!("Installation Forge échouée: {}", 
            String::from_utf8_lossy(&install_output.stderr)));
    }
    
    println!("Forge installé avec succès!");
    
    // Créer les fichiers de configuration
    let eula_path = server_path.join("eula.txt");
    let mut eula_file = fs::File::create(&eula_path)
        .map_err(|e| format!("Erreur création EULA: {}", e))?;
    eula_file.write_all(b"eula=true\n")
        .map_err(|e| format!("Erreur écriture EULA: {}", e))?;
    
    let properties_content = create_server_properties(&config);
    
    let properties_path = server_path.join("server.properties");
    let mut properties_file = fs::File::create(&properties_path)
        .map_err(|e| format!("Erreur création properties: {}", e))?;
    properties_file.write_all(properties_content.as_bytes())
        .map_err(|e| format!("Erreur écriture properties: {}", e))?;
    
    // Trouver le JAR Forge généré
    let _forge_jar = format!("forge-{}-shim.jar", config.version);
    
    // Créer le script de lancement avec le bon chemin Java
    let ram_mb = config.ram;
    let ram_gb = ram_mb / 1024;
    let bat_content = format!(
        "@echo off\n\
         title Nether Client - {}\n\
         echo Demarrage du serveur Forge {}...\n\
         echo Utilisation de Java: {}\n\
         \"{}\" -Xmx{}G -Xms{}G @user_jvm_args.txt @libraries/net/minecraftforge/forge/{}/win_args.txt nogui\n\
         pause\n",
        config.name,
        config.name,
        java_path,
        java_path,
        ram_gb,
        ram_gb / 2,
        config.version
    );
    
    let bat_path = server_path.join("start.bat");
    let mut bat_file = fs::File::create(&bat_path)
        .map_err(|e| format!("Erreur création BAT: {}", e))?;
    bat_file.write_all(bat_content.as_bytes())
        .map_err(|e| format!("Erreur écriture BAT: {}", e))?;
    
    println!("Serveur Forge créé avec succès!");
    
    Ok(server_id)
}

// Commande pour créer un serveur NeoForge
#[tauri::command]
async fn create_neoforge_server(config: ServerConfig) -> Result<String, String> {
    use std::env;
    use std::path::PathBuf;
    use std::fs;
    use std::io::Write;
    
    println!("Création du serveur NeoForge: {}", config.name);
    
    let server_id = format!("server_{}", chrono::Utc::now().timestamp());
    
    // Créer le dossier du serveur
    let app_data = env::var("APPDATA").map_err(|e| e.to_string())?;
    let server_path = PathBuf::from(&app_data)
        .join("NetherClient")
        .join("Serveurs")
        .join(&config.name);
    
    fs::create_dir_all(&server_path).map_err(|e| e.to_string())?;
    println!("Dossier créé: {}", server_path.display());
    
    // Télécharger l'installeur NeoForge
    println!("Téléchargement de NeoForge {}...", config.version);
    
    let neoforge_url = format!(
        "https://maven.neoforged.net/releases/net/neoforged/neoforge/{}/neoforge-{}-installer.jar",
        config.version, config.version
    );
    
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(300))
        .build()
        .map_err(|e| e.to_string())?;
    
    let installer_bytes = client
        .get(&neoforge_url)
        .send()
        .await
        .map_err(|e| format!("Erreur téléchargement NeoForge: {}", e))?
        .bytes()
        .await
        .map_err(|e| format!("Erreur lecture NeoForge: {}", e))?;
    
    let installer_path = server_path.join("neoforge-installer.jar");
    let mut installer_file = fs::File::create(&installer_path)
        .map_err(|e| format!("Erreur création installer: {}", e))?;
    installer_file.write_all(&installer_bytes)
        .map_err(|e| format!("Erreur écriture installer: {}", e))?;
    
    println!("Installeur NeoForge téléchargé: {} octets", installer_bytes.len());
    
    // Obtenir le chemin Java correct pour cette version Minecraft
    let java_path = get_java_executable_path(&config.version).await?;
    println!("Utilisation de Java: {}", java_path);
    
    // Vérifier que le fichier Java existe
    if !std::path::Path::new(&java_path).exists() {
        return Err(format!("Le fichier Java n'existe pas: {}. Veuillez installer Java ou vérifier votre installation.", java_path));
    }
    
    // Exécuter l'installeur NeoForge
    println!("Installation de NeoForge...");
    let install_output = Command::new(&java_path)
        .args(["-jar", "neoforge-installer.jar", "--installServer"])
        .current_dir(&server_path)
        .output()
        .map_err(|e| format!("Erreur installation NeoForge: {}. Chemin Java utilisé: {}", e, java_path))?;
    
    if !install_output.status.success() {
        return Err(format!("Installation NeoForge échouée: {}", 
            String::from_utf8_lossy(&install_output.stderr)));
    }
    
    println!("NeoForge installé avec succès!");
    
    // Créer les fichiers de configuration
    let eula_path = server_path.join("eula.txt");
    let mut eula_file = fs::File::create(&eula_path)
        .map_err(|e| format!("Erreur création EULA: {}", e))?;
    eula_file.write_all(b"eula=true\n")
        .map_err(|e| format!("Erreur écriture EULA: {}", e))?;
    
    let properties_content = create_server_properties(&config);
    
    let properties_path = server_path.join("server.properties");
    let mut properties_file = fs::File::create(&properties_path)
        .map_err(|e| format!("Erreur création properties: {}", e))?;
    properties_file.write_all(properties_content.as_bytes())
        .map_err(|e| format!("Erreur écriture properties: {}", e))?;
    
    // Créer le script de lancement avec le bon chemin Java
    let ram_mb = config.ram;
    let ram_gb = ram_mb / 1024;
    let bat_content = format!(
        "@echo off\n\
         title Nether Client - {}\n\
         echo Demarrage du serveur NeoForge {}...\n\
         echo Utilisation de Java: {}\n\
         \"{}\" -Xmx{}G -Xms{}G @user_jvm_args.txt @libraries/net/neoforged/neoforge/{}/win_args.txt nogui\n\
         pause\n",
        config.name,
        config.name,
        java_path,
        java_path,
        ram_gb,
        ram_gb / 2,
        config.version
    );
    
    let bat_path = server_path.join("start.bat");
    let mut bat_file = fs::File::create(&bat_path)
        .map_err(|e| format!("Erreur création BAT: {}", e))?;
    bat_file.write_all(bat_content.as_bytes())
        .map_err(|e| format!("Erreur écriture BAT: {}", e))?;
    
    println!("Serveur NeoForge créé avec succès!");
    
    Ok(server_id)
}

// Fonction pour tester la connectivité réseau
async fn test_network_connectivity() -> Result<(), String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;
    
    // Tester plusieurs domaines pour vérifier la connectivité
    let test_urls = vec![
        "https://github.com",
        "https://google.com",
        "https://cloudflare.com",
    ];
    
    for url in test_urls {
        match client.get(url).send().await {
            Ok(_) => {
                println!("Connectivité réseau OK: {}", url);
                return Ok(());
            }
            Err(e) => {
                println!("Erreur connectivité vers {}: {}", url, e);
            }
        }
    }
    
    Err("Aucune connectivité réseau détectée. Vérifiez votre connexion Internet.".to_string())
}

// Fonction utilitaire pour créer un server.properties correct
fn create_server_properties(config: &ServerConfig) -> String {
    format!(
        "#Minecraft server properties
#Generated by Nether Client
server-port={}
server-ip=0.0.0.0
max-players={}
motd={}
difficulty={}
gamemode={}
online-mode=true
white-list=false
pvp=true
allow-flight=false
enable-command-block=true
spawn-protection=16
level-name=world
level-type=DEFAULT
hardcore=false
enable-query=false
enable-rcon=false
resource-pack=
resource-pack-sha1=
max-world-size=29999984
view-distance=10
spawn-npcs=true
spawn-animals=true
generate-structures=true
allow-nether=true
broadcast-console-to-ops=true
player-idle-timeout=0
max-build-height=256
level-seed=
prevent-proxy-connections=false
",
        config.port,
        config.max_players,
        config.motd,
        config.difficulty,
        config.gamemode
    )
}

// Commande pour créer un serveur MohistMC avec fichier local optionnel
#[tauri::command]
async fn create_mohist_server(config: ServerConfig, local_jar_path: Option<String>) -> Result<String, String> {
    use std::env;
    use std::path::PathBuf;
    use std::fs;
    use std::io::Write;
    
    println!("Création du serveur MohistMC: {}", config.name);
    
    // Tester la connectivité réseau avant de commencer
    test_network_connectivity().await.map_err(|e| {
        format!("Problème de connectivité réseau: {}. Veuillez vérifier votre connexion Internet et réessayer.", e)
    })?;
    
    let server_id = format!("server_{}", chrono::Utc::now().timestamp());
    
    // Créer le dossier du serveur
    let app_data = env::var("APPDATA").map_err(|e| e.to_string())?;
    let server_path = PathBuf::from(&app_data)
        .join("NetherClient")
        .join("Serveurs")
        .join(&config.name);
    
    fs::create_dir_all(&server_path).map_err(|e| e.to_string())?;
    println!("Dossier créé: {}", server_path.display());
    
    // Utiliser le fichier local s'il est fourni, sinon copier depuis les assets intégrés
    let server_bytes = if let Some(local_path) = local_jar_path {
        println!("Utilisation du fichier local: {}", local_path);
        fs::read(&local_path).map_err(|e| format!("Erreur lecture fichier local {}: {}", local_path, e))?
    } else {
        // Copier depuis les assets intégrés de l'application
        println!("Copie de MohistMC {} depuis les assets intégrés...", config.version);
        
        // Mapping des versions vers les fichiers JAR avec hash
        let jar_filename = match config.version.as_str() {
            "1.12.2" => "mohist-1.12.2-5af9344.jar",
            "1.16.5" => "mohist-1.16.5-8c7caaf.jar",
            "1.18.2" => "mohist-1.18.2-aecc5e9.jar",
            "1.19.4" => "mohist-1.19.4-c1f9ddb.jar",
            "1.7.10" => "mohist-1.7.10-de68ad7.jar",
            _ => {
                return Err(format!("Version MohistMC {} non supportée. Versions disponibles: 1.7.10, 1.12.2, 1.16.5, 1.18.2, 1.19.4", config.version));
            }
        };
        
        // Chemin vers les assets intégrés (plusieurs emplacements possibles)
        let exe_path = std::env::current_exe()
            .map_err(|e| format!("Erreur récupération chemin exécutable: {}", e))?;
        
        let possible_paths = vec![
            // Chemin standard
            exe_path.parent()
                .ok_or("Impossible de récupérer le dossier parent")?
                .join("assets")
                .join("mohist")
                .join(jar_filename),
            // Chemin alternatif (pour certains builds)
            exe_path.parent()
                .ok_or("Impossible de récupérer le dossier parent")?
                .join("resources")
                .join("assets")
                .join("mohist")
                .join(jar_filename),
        ];
        
        let assets_path = possible_paths.iter()
            .find(|path| path.exists())
            .ok_or_else(|| {
                format!("Fichier MohistMC {} non trouvé dans les assets intégrés. Chemins testés: {}", 
                    jar_filename, 
                    possible_paths.iter()
                        .map(|p| p.display().to_string())
                        .collect::<Vec<_>>()
                        .join(", "))
            })?;
        
        println!("Chemin des assets trouvé: {}", assets_path.display());
        
        // Lire le fichier depuis les assets
        fs::read(&assets_path).map_err(|e| format!("Erreur lecture fichier asset {}: {}", assets_path.display(), e))?
    };
    
    let server_jar_path = server_path.join(format!("mohist-{}-server.jar", config.version));
    let mut server_file = fs::File::create(&server_jar_path)
        .map_err(|e| format!("Erreur création serveur: {}", e))?;
    server_file.write_all(&server_bytes)
        .map_err(|e| format!("Erreur écriture serveur: {}", e))?;
    
    println!("Serveur MohistMC téléchargé: {} octets", server_bytes.len());
    
    // Obtenir le chemin Java correct pour cette version Minecraft
    let java_path = get_java_executable_path(&config.version).await?;
    println!("Utilisation de Java: {}", java_path);
    
    // Créer les fichiers de configuration
    let eula_path = server_path.join("eula.txt");
    let mut eula_file = fs::File::create(&eula_path)
        .map_err(|e| format!("Erreur création EULA: {}", e))?;
    eula_file.write_all(b"eula=true\n")
        .map_err(|e| format!("Erreur écriture EULA: {}", e))?;
    
    let properties_content = create_server_properties(&config);
    
    let properties_path = server_path.join("server.properties");
    let mut properties_file = fs::File::create(&properties_path)
        .map_err(|e| format!("Erreur création properties: {}", e))?;
    properties_file.write_all(properties_content.as_bytes())
        .map_err(|e| format!("Erreur écriture properties: {}", e))?;
    
    // Créer le script de lancement avec le bon chemin Java
    let ram_mb = config.ram;
    let ram_gb = ram_mb / 1024;
    let bat_content = format!(
        "@echo off\n\
         title Nether Client - {}\n\
         echo Demarrage du serveur MohistMC {}...\n\
         echo Utilisation de Java: {}\n\
         echo.\n\
         echo [INFO] Lancement du serveur...\n\
         \"{}\" -Xmx{}G -Xms{}G -jar mohist-{}-server.jar nogui\n\
         if %ERRORLEVEL% neq 0 (\n\
             echo [ERROR] Erreur lors du demarrage du serveur (Code: %ERRORLEVEL%)\n\
         )\n\
         echo.\n\
         echo [INFO] Serveur arrete. Appuyez sur une touche pour fermer...\n\
         pause >nul\n",
        config.name,
        config.name,
        java_path,
        java_path,
        ram_gb,
        ram_gb / 2,
        config.version
    );
    
    let bat_path = server_path.join("start.bat");
    let mut bat_file = fs::File::create(&bat_path)
        .map_err(|e| format!("Erreur création BAT: {}", e))?;
    bat_file.write_all(bat_content.as_bytes())
        .map_err(|e| format!("Erreur écriture BAT: {}", e))?;
    
    println!("Serveur MohistMC créé avec succès!");
    
    Ok(server_id)
}

// Commande pour récupérer les versions Paper depuis l'API
#[tauri::command]
async fn get_paper_versions() -> Result<Vec<serde_json::Value>, String> {
    println!("Récupération des versions Paper depuis l'API...");
    
    let api_url = "https://api.papermc.io/v2/projects/paper";
    
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Erreur création client HTTP: {}", e))?;
    
    let response = client
        .get(api_url)
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| format!("Erreur requête API Paper: {}", e))?;
    
    if !response.status().is_success() {
        let status = response.status();
        return Err(format!("Erreur HTTP {}: {}", status, status.as_str()));
    }
    
    let data: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Erreur parsing JSON: {}", e))?;
    
    let version_list = data["versions"]
        .as_array()
        .ok_or("Format de réponse invalide: 'versions' n'est pas un tableau")?;
    
    let mut versions_with_builds = Vec::new();
    
    // Limiter à 50 versions pour éviter trop de requêtes
    for (index, version) in version_list.iter().take(50).enumerate() {
        if let Some(version_str) = version.as_str() {
            println!("Récupération des builds pour {} ({}/{})...", version_str, index + 1, version_list.len().min(50));
            
            let builds_url = format!("https://api.papermc.io/v2/projects/paper/versions/{}/builds", version_str);
            
            match client
                .get(&builds_url)
                .header("Accept", "application/json")
                .send()
                .await
            {
                Ok(builds_response) => {
                    if builds_response.status().is_success() {
                        if let Ok(builds_data) = builds_response.json::<serde_json::Value>().await {
                            let builds = builds_data["builds"]
                                .as_array()
                                .map(|arr| {
                                    arr.iter()
                                        .filter_map(|b| b["build"].as_u64().map(|n| n as u32))
                                        .collect::<Vec<u32>>()
                                })
                                .unwrap_or_default();
                            
                            let latest_build = builds.iter().max().copied().unwrap_or(1);
                            
                            versions_with_builds.push(serde_json::json!({
                                "version": version_str,
                                "builds": builds,
                                "latestBuild": latest_build
                            }));
                        }
                    }
                }
                Err(e) => {
                    println!("⚠️ Erreur récupération builds pour {}: {}", version_str, e);
                    // Ajouter quand même la version avec un build par défaut
                    versions_with_builds.push(serde_json::json!({
                        "version": version_str,
                        "builds": [1],
                        "latestBuild": 1
                    }));
                }
            }
        }
    }
    
    if versions_with_builds.is_empty() {
        return Err("Aucune version Paper trouvée".to_string());
    }
    
    println!("✅ {} versions Paper récupérées", versions_with_builds.len());
    Ok(versions_with_builds)
}

// Commande pour créer un serveur Paper
#[tauri::command]
async fn create_paper_server(config: ServerConfig) -> Result<String, String> {
    use std::env;
    use std::path::PathBuf;
    use std::fs;
    use std::io::Write;
    
    println!("Création du serveur Paper: {}", config.name);
    
    // Tester la connectivité réseau avant de commencer
    test_network_connectivity().await.map_err(|e| {
        format!("Problème de connectivité réseau: {}. Veuillez vérifier votre connexion Internet et réessayer.", e)
    })?;
    
    let server_id = format!("server_{}", chrono::Utc::now().timestamp());
    
    // Créer le dossier du serveur
    let app_data = env::var("APPDATA").map_err(|e| e.to_string())?;
    let server_path = PathBuf::from(&app_data)
        .join("NetherClient")
        .join("Serveurs")
        .join(&config.name);
    
    fs::create_dir_all(&server_path).map_err(|e| e.to_string())?;
    println!("Dossier créé: {}", server_path.display());
    
    // Télécharger le JAR Paper depuis l'API PaperMC
    let build = config.build.unwrap_or(1);
    let paper_url = format!(
        "https://api.papermc.io/v2/projects/paper/versions/{}/builds/{}/downloads/paper-{}-{}.jar",
        config.version, build, config.version, build
    );
    
    println!("Téléchargement de Paper {} build {}...", config.version, build);
    println!("URL: {}", paper_url);
    
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(300))
        .build()
        .map_err(|e| e.to_string())?;
    
    let jar_bytes = client
        .get(&paper_url)
        .send()
        .await
        .map_err(|e| format!("Erreur téléchargement Paper: {}. Vérifiez que la version et le build existent.", e))?
        .bytes()
        .await
        .map_err(|e| format!("Erreur lecture Paper: {}", e))?;
    
    // Sauvegarder le JAR
    let jar_path = server_path.join("paper.jar");
    let mut jar_file = fs::File::create(&jar_path)
        .map_err(|e| format!("Erreur création JAR: {}", e))?;
    jar_file.write_all(&jar_bytes)
        .map_err(|e| format!("Erreur écriture JAR: {}", e))?;
    
    println!("JAR Paper téléchargé: {} octets", jar_bytes.len());
    
    // Créer eula.txt
    let eula_path = server_path.join("eula.txt");
    let mut eula_file = fs::File::create(&eula_path)
        .map_err(|e| format!("Erreur création EULA: {}", e))?;
    eula_file.write_all(b"eula=true\n")
        .map_err(|e| format!("Erreur écriture EULA: {}", e))?;
    
    // Créer server.properties
    let properties_content = create_server_properties(&config);
    
    let properties_path = server_path.join("server.properties");
    let mut properties_file = fs::File::create(&properties_path)
        .map_err(|e| format!("Erreur création properties: {}", e))?;
    properties_file.write_all(properties_content.as_bytes())
        .map_err(|e| format!("Erreur écriture properties: {}", e))?;
    
    // Créer bukkit.yml (configuration Bukkit)
    let bukkit_content = "# This is the main configuration file for Bukkit.
# As you can see, there's tons to configure. Some options may impact gameplay, so use
# with caution, and make sure you know what each option does before configuring.
# For a reference for any variable inside this file, check out the Bukkit wiki at
# https://www.spigotmc.org/go/bukkit-yml

settings:
  allow-end: true
  warn-on-overload: true
  permissions-file: permissions.yml
  update-folder: update
  plugin-profiling: false
  connection-throttle: 4000
  query-plugins: true
  deprecated-verbose: default
  shutdown-message: Server closed
  minimum-api: none
  use-map-color-cache: true
spawn-limits:
  monsters: 70
  animals: 10
  water-animals: 5
  water-ambient: 20
  water-underground-creature: 5
  axolotls: 5
  ambient: 15
chunk-gc:
  period-in-ticks: 600
ticks-per:
  animal-spawns: 400
  monster-spawns: 1
  water-spawns: 1
  water-ambient-spawns: 1
  water-underground-creature-spawns: 1
  axolotl-spawns: 1
  ambient-spawns: 1
  autosave: 6000
aliases: now-in-commands.yml
";
    
    let bukkit_path = server_path.join("bukkit.yml");
    let mut bukkit_file = fs::File::create(&bukkit_path)
        .map_err(|e| format!("Erreur création bukkit.yml: {}", e))?;
    bukkit_file.write_all(bukkit_content.as_bytes())
        .map_err(|e| format!("Erreur écriture bukkit.yml: {}", e))?;
    
    // Créer spigot.yml (configuration Spigot)
    let spigot_content = "# This is the main configuration file for Spigot.
# As you can see, there's tons to configure. Some options may impact gameplay, so use
# with caution, and make sure you know what each option does before configuring.
# For a reference for any variable inside this file, check out the Spigot wiki at
# http://www.spigotmc.org/wiki/spigot-configuration/

settings:
  debug: false
  bungeecord: false
  player-shuffle: 0
  user-cache-size: 1000
  sample-count: 12
  netty-threads: 4
  attribute:
    maxHealth:
      max: 2048.0
    movementSpeed:
      max: 2048.0
    attackDamage:
      max: 2048.0
  log-villager-deaths: true
  log-named-deaths: true
  moved-too-quickly-multiplier: 10.0
  save-user-cache-on-stop-only: false
  moved-wrongly-threshold: 0.0625
  timeout-time: 60
  restart-on-crash: true
  restart-script: ./start.sh
messages:
  whitelist: You are not whitelisted on this server!
  unknown-command: Unknown command. Type \"/help\" for help.
  server-full: The server is full!
  outdated-client: Outdated client! Please use {0}
  outdated-server: Outdated server! I'm still on {0}
  restart: Server is restarting
advancements:
  disable-saving: false
  disabled: []
commands:
  tab-complete: 0
  send-namespaced: true
  log: true
  spam-exclusions: []
  replace-commands: []
  silent-commandblock-console: false
players:
  disable-saving: false
world-settings:
  default:
    below-zero-generation-in-existing-chunks: true
    hanging-tick-frequency: 100
    wither-spawn-sound-radius: 0
    enable-zombie-pigmen-portal-spawns: true
    arrow-despawn-rate: 1200
    trident-despawn-rate: 1200
    mob-spawn-range: 8
    zombie-aggressive-towards-villager: true
    nerf-spawner-mobs: false
    view-distance: default
    simulation-distance: default
    thunder-chance: 100000
    dragon-death-sound-radius: 0
    merge-radius:
      item: 2.5
      exp: 3.0
    item-despawn-rate: 6000
    end-portal-sound-radius: 0
    growth:
      cactus-modifier: 100
      cane-modifier: 100
      melon-modifier: 100
      mushroom-modifier: 100
      pumpkin-modifier: 100
      sapling-modifier: 100
      beetroot-modifier: 100
      carrot-modifier: 100
      potato-modifier: 100
      wheat-modifier: 100
      netherwart-modifier: 100
      vine-modifier: 100
      cocoa-modifier: 100
      bamboo-modifier: 100
      sweetberry-modifier: 100
      kelp-modifier: 100
      twistingvines-modifier: 100
      weepingvines-modifier: 100
      cavevines-modifier: 100
      glowberry-modifier: 100
    entity-activation-range:
      animals: 32
      monsters: 32
      raiders: 48
      misc: 16
      water: 16
      villagers: 32
      flying-monsters: 32
      wake-up-inactive:
        animals-max-per-tick: 4
        animals-every: 1200
        animals-for: 100
        monsters-max-per-tick: 8
        monsters-every: 400
        monsters-for: 100
        villagers-max-per-tick: 4
        villagers-every: 600
        villagers-for: 100
        flying-monsters-max-per-tick: 8
        flying-monsters-every: 200
        flying-monsters-for: 100
      villagers-work-immunity-after: 100
      villagers-work-immunity-for: 20
      villagers-active-for-panic: true
      tick-inactive-villagers: true
      ignore-spectators: false
    seed-village: 10387312
    seed-desert: 14357617
    seed-igloo: 14357618
    seed-jungle: 14357619
    seed-swamp: 14357620
    seed-monument: 10387313
    seed-shipwreck: 165745295
    seed-ocean: 14357621
    seed-outpost: 165745296
    seed-endcity: 10387313
    seed-slime: 987234911
    seed-nether: 30084232
    seed-mansion: 10387319
    seed-fossil: 14357921
    seed-portal: 34222645
    seed-stronghold: default
    ticks-per:
      hopper-transfer: 8
      hopper-check: 1
    hopper-amount: 1
    hopper-can-load-chunks: false
    entity-tracking-range:
      players: 48
      animals: 48
      monsters: 48
      misc: 32
      other: 64
    max-tnt-per-tick: 100
    hunger:
      jump-walk-exhaustion: 0.05
      jump-sprint-exhaustion: 0.2
      combat-exhaustion: 0.1
      regen-exhaustion: 6.0
      swim-multiplier: 0.01
      sprint-multiplier: 0.1
      other-multiplier: 0.0
    max-tick-time:
      tile: 50
      entity: 50
    verbose: false
config-version: 12
stats:
  disable-saving: false
  forced-stats: {}
";
    
    let spigot_path = server_path.join("spigot.yml");
    let mut spigot_file = fs::File::create(&spigot_path)
        .map_err(|e| format!("Erreur création spigot.yml: {}", e))?;
    spigot_file.write_all(spigot_content.as_bytes())
        .map_err(|e| format!("Erreur écriture spigot.yml: {}", e))?;
    
    // Créer le dossier plugins
    let plugins_path = server_path.join("plugins");
    fs::create_dir_all(&plugins_path)
        .map_err(|e| format!("Erreur création dossier plugins: {}", e))?;
    
    // Obtenir le chemin Java correct pour cette version Minecraft
    let java_path = get_java_executable_path(&config.version).await?;
    println!("Utilisation de Java: {}", java_path);
    
    // Créer le script de lancement avec le bon chemin Java
    let ram_mb = config.ram;
    let ram_gb = ram_mb / 1024;
    let bat_content = format!(
        "@echo off\n\
         title Nether Client - {}\n\
         echo Demarrage du serveur Paper {}...\n\
         echo Utilisation de Java: {}\n\
         echo.\n\
         echo [INFO] Lancement du serveur...\n\
         \"{}\" -Xmx{}G -Xms{}G -jar paper.jar nogui\n\
         if %ERRORLEVEL% neq 0 (\n\
             echo [ERROR] Erreur lors du demarrage du serveur (Code: %ERRORLEVEL%)\n\
         )\n\
         echo.\n\
         echo [INFO] Serveur arrete. Appuyez sur une touche pour fermer...\n\
         pause >nul\n",
        config.name,
        config.name,
        java_path,
        java_path,
        ram_gb,
        ram_gb / 2
    );
    
    let bat_path = server_path.join("start.bat");
    let mut bat_file = fs::File::create(&bat_path)
        .map_err(|e| format!("Erreur création BAT: {}", e))?;
    bat_file.write_all(bat_content.as_bytes())
        .map_err(|e| format!("Erreur écriture BAT: {}", e))?;
    
    println!("Serveur Paper créé avec succès!");
    
    Ok(server_id)
}

// Commande pour démarrer un serveur avec capture des logs en temps réel
#[tauri::command]
async fn start_server(server_name: String, server_path: String) -> Result<(), String> {
    use std::path::PathBuf;
    
    println!("Démarrage du serveur: {} depuis {}", server_name, server_path);
    
    let path = PathBuf::from(&server_path);
    
    // Vérifier si le script start.bat existe
    let bat_path = path.join("start.bat");
    if !bat_path.exists() {
        return Err(format!("Script de démarrage non trouvé: {}", bat_path.display()));
    }
    
    // Initialiser les logs pour ce serveur
    {
        let mut logs = SERVER_LOGS.lock().unwrap();
        logs.insert(server_name.clone(), Vec::new());
    }
    
    // Démarrer le serveur avec le script .bat (fenêtre CMD stable)
    let mut child = Command::new("cmd")
        .args(["/K", "start.bat"])
        .current_dir(&path)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Erreur démarrage serveur: {}", e))?;
    
    let pid = child.id();
    println!("Serveur démarré avec PID: {}", pid);
    
    // Extraire stdin pour l'envoi de commandes
    let stdin = child.stdin.take();
    
    // Extraire stdout et stderr pour la capture des logs
    let stdout = child.stdout.take();
    let stderr = child.stderr.take();
    
    // Thread pour capturer stdout
    if let Some(stdout) = stdout {
        let server_name_clone = server_name.clone();
        thread::spawn(move || {
            let reader = BufReader::new(stdout);
            for line in reader.lines() {
                if let Ok(line) = line {
                    let mut logs = SERVER_LOGS.lock().unwrap();
                    if let Some(server_logs) = logs.get_mut(&server_name_clone) {
                        server_logs.push(line.clone());
                        // Garder seulement les 500 dernières lignes
                        if server_logs.len() > 500 {
                            server_logs.remove(0);
                        }
                    }
                    println!("[{}] {}", server_name_clone, line);
                }
            }
        });
    }
    
    // Thread pour capturer stderr
    if let Some(stderr) = stderr {
        let server_name_clone = server_name.clone();
        thread::spawn(move || {
            let reader = BufReader::new(stderr);
            for line in reader.lines() {
                if let Ok(line) = line {
                    let mut logs = SERVER_LOGS.lock().unwrap();
                    if let Some(server_logs) = logs.get_mut(&server_name_clone) {
                        server_logs.push(format!("[ERROR] {}", line));
                        if server_logs.len() > 500 {
                            server_logs.remove(0);
                        }
                    }
                    eprintln!("[{}] {}", server_name_clone, line);
                }
            }
        });
    }
    
    // Stocker le processus dans le gestionnaire global
    let mut processes = SERVER_PROCESSES.lock().unwrap();
    processes.insert(server_name.clone(), ServerProcess { child, stdin });
    
    Ok(())
}

// Commande pour arrêter un serveur
#[tauri::command]
async fn stop_server(server_name: String) -> Result<(), String> {
    println!("Arrêt du serveur: {}", server_name);
    
    // Récupérer le processus depuis le gestionnaire global
    let server_process = {
        let mut processes = SERVER_PROCESSES.lock().unwrap();
        processes.remove(&server_name)
    };
    
    if let Some(mut server_process) = server_process {
        // Envoyer la commande "stop" au serveur
        if let Some(mut stdin) = server_process.stdin.take() {
            let _ = stdin.write_all(b"stop\n");
            let _ = stdin.flush();
        }
        
        // Attendre que le processus se termine (max 10 secondes)
        let timeout = std::time::Duration::from_secs(10);
        let start = std::time::Instant::now();
        
        loop {
            match server_process.child.try_wait() {
                Ok(Some(_status)) => {
                    println!("Serveur arrêté proprement");
                    break;
                }
                Ok(None) => {
                    if start.elapsed() > timeout {
                        println!("Timeout - Arrêt forcé du serveur");
                        let _ = server_process.child.kill();
                        break;
                    }
                    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
                }
                Err(e) => {
                    return Err(format!("Erreur lors de l'arrêt: {}", e));
                }
            }
        }
        
        Ok(())
    } else {
        Err(format!("Serveur {} non trouvé ou déjà arrêté", server_name))
    }
}

// Commande pour mettre à jour les propriétés d'un serveur
#[tauri::command]
async fn update_server_properties(server_name: String, properties: serde_json::Value) -> Result<(), String> {
    use std::env;
    use std::path::PathBuf;
    use std::fs;
    use std::io::Write;
    
    println!("Mise à jour des propriétés du serveur: {}", server_name);
    
    // Chemin vers le dossier du serveur
    let app_data = env::var("APPDATA").map_err(|e| e.to_string())?;
    let server_path = PathBuf::from(&app_data)
        .join("NetherClient")
        .join("Serveurs")
        .join(&server_name);
    
    let properties_file = server_path.join("server.properties");
    
    if !properties_file.exists() {
        return Err(format!("Fichier server.properties non trouvé: {}", properties_file.display()));
    }
    
    // Lire le fichier existant
    let mut existing_properties = std::collections::HashMap::new();
    if let Ok(content) = fs::read_to_string(&properties_file) {
        for line in content.lines() {
            if let Some((key, value)) = line.split_once('=') {
                existing_properties.insert(key.to_string(), value.to_string());
            }
        }
    }
    
    // Mettre à jour avec les nouvelles propriétés
    if let Some(props) = properties.as_object() {
        for (key, value) in props {
            if let Some(val) = value.as_str() {
                existing_properties.insert(key.clone(), val.to_string());
            } else if let Some(val) = value.as_bool() {
                existing_properties.insert(key.clone(), val.to_string());
            } else if let Some(val) = value.as_i64() {
                existing_properties.insert(key.clone(), val.to_string());
            }
        }
    }
    
    // Écrire le fichier mis à jour
    let mut file = fs::File::create(&properties_file)
        .map_err(|e| format!("Erreur création fichier: {}", e))?;
    
    // Propriétés dans l'ordre standard Minecraft
    let property_order = [
        "server-port", "max-players", "motd", "difficulty", "gamemode",
        "online-mode", "pvp", "spawn-protection", "view-distance", "simulation-distance",
        "white-list", "allow-flight", "enable-command-block", "spawn-monsters",
        "allow-nether", "force-gamemode", "resource-pack", "resource-pack-sha1"
    ];
    
    // Écrire les propriétés dans l'ordre
    for prop in &property_order {
        if let Some(value) = existing_properties.get(*prop) {
            writeln!(file, "{}={}", prop, value)
                .map_err(|e| format!("Erreur écriture: {}", e))?;
        }
    }
    
    // Écrire les propriétés restantes
    for (key, value) in &existing_properties {
        if !property_order.contains(&key.as_str()) {
            writeln!(file, "{}={}", key, value)
                .map_err(|e| format!("Erreur écriture: {}", e))?;
        }
    }
    
    println!("Propriétés mises à jour: {}", properties_file.display());
    Ok(())
}

// Commande pour obtenir le statut d'un serveur
#[tauri::command]
async fn delete_server_folder(server_name: String, server_path: String) -> Result<(), String> {
    use std::path::PathBuf;
    use std::fs;
    use std::thread;
    use std::time::Duration;
    
    println!("🗑️ Suppression du dossier du serveur: {} ({})", server_name, server_path);
    
    let path = PathBuf::from(&server_path);
    
    // Vérifier que le dossier existe
    if !path.exists() {
        println!("⚠️ Le dossier n'existe pas : {}", path.display());
        return Ok(()); // Déjà supprimé
    }
    
    println!("📂 Dossier trouvé, tentative de suppression...");
    
    // Attendre un peu pour que les processus se ferment complètement
    thread::sleep(Duration::from_millis(500));
    
    // Tenter la suppression avec retry (max 5 tentatives)
    let mut attempts = 0;
    let max_attempts = 5;
    
    loop {
        attempts += 1;
        
        match fs::remove_dir_all(&path) {
            Ok(_) => {
                println!("✅ Dossier supprimé avec succès: {}", path.display());
                return Ok(());
            }
            Err(e) => {
                if attempts >= max_attempts {
                    println!("❌ Échec après {} tentatives: {}", max_attempts, e);
                    return Err(format!(
                        "Impossible de supprimer le dossier après {} tentatives.\n\n\
                        Erreur : {}\n\n\
                        Le dossier peut contenir des fichiers verrouillés.\n\
                        Essayez de redémarrer l'application ou supprimez manuellement :\n{}",
                        max_attempts, e, path.display()
                    ));
                }
                
                println!("⚠️ Tentative {}/{} échouée : {}", attempts, max_attempts, e);
                println!("⏳ Attente 1 seconde avant retry...");
                thread::sleep(Duration::from_secs(1));
            }
        }
    }
}

#[tauri::command]
async fn get_server_status(server_name: String) -> Result<bool, String> {
    println!("Vérification du statut du serveur: {}", server_name);
    
    // Vérifier si le processus existe dans le gestionnaire
    let mut processes = SERVER_PROCESSES.lock().unwrap();
    
    if let Some(server_process) = processes.get_mut(&server_name) {
        // Vérifier si le processus est toujours en cours
        match server_process.child.try_wait() {
            Ok(Some(_)) => {
                // Le processus s'est terminé
                processes.remove(&server_name);
                Ok(false)
            }
            Ok(None) => {
                // Le processus est toujours en cours
                Ok(true)
            }
            Err(_) => {
                // Erreur lors de la vérification
                processes.remove(&server_name);
                Ok(false)
            }
        }
    } else {
        // Le serveur n'est pas dans le gestionnaire
        Ok(false)
    }
}

// Commande pour télécharger une version Minecraft
#[tauri::command]
async fn download_minecraft_version(version: String) -> Result<String, String> {
    println!("Téléchargement de la version: {}", version);
    
    // Simuler le téléchargement
    tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
    
    Ok(format!("minecraft_server_{}.jar", version))
}

// Commande pour obtenir les versions disponibles
#[tauri::command]
async fn get_minecraft_versions() -> Result<Vec<String>, String> {
    println!("Récupération des versions Minecraft");
    
    // Simuler la récupération des versions
    let versions = vec![
        "1.20.1".to_string(),
        "1.20".to_string(),
        "1.19.4".to_string(),
        "1.19.3".to_string(),
        "1.19.2".to_string(),
    ];
    
    Ok(versions)
}

// Commande pour vérifier Java
#[tauri::command]
async fn check_java_installation() -> Result<Vec<String>, String> {
    println!("Vérification de l'installation Java");
    
    // Simuler la vérification Java
    let java_versions = vec![
        "8".to_string(),
        "17".to_string(),
        "21".to_string(),
    ];
    
    Ok(java_versions)
}

// Commande pour ouvrir un dossier
#[tauri::command]
async fn open_folder(path: String) -> Result<(), String> {
    println!("Ouverture du dossier: {}", path);
    
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

// Commande pour envoyer une notification
#[tauri::command]
async fn send_notification(title: String, body: String) -> Result<(), String> {
    println!("Notification: {} - {}", title, body);
    Ok(())
}

// Commande pour obtenir les informations système
#[tauri::command]
async fn get_system_info() -> Result<serde_json::Value, String> {
    use sysinfo::System;
    
    let mut sys = System::new_all();
    sys.refresh_all();
    
    // Informations CPU
    let cpu_count = sys.cpus().len();
    let cpu_brand = if !sys.cpus().is_empty() {
        sys.cpus()[0].brand().to_string()
    } else {
        "Unknown".to_string()
    };
    
    // Informations RAM (en MB)
    let total_ram = sys.total_memory() / 1024 / 1024;
    let used_ram = sys.used_memory() / 1024 / 1024;
    let available_ram = total_ram - used_ram;
    
    // Informations disque (valeurs par défaut pour l'instant)
    // La détection du disque nécessite une version plus récente de sysinfo
    let total_disk: u64 = 512000; // 500 GB par défaut
    let used_disk: u64 = 256000; // 250 GB par défaut
    let available_disk: u64 = 256000; // 250 GB par défaut
    
    // Informations OS
    let os_name = System::name().unwrap_or_else(|| "Windows".to_string());
    let os_version = System::os_version().unwrap_or_else(|| "10".to_string());
    let arch = std::env::consts::ARCH;
    
    let info = serde_json::json!({
        "os": os_name,
        "osVersion": os_version,
        "arch": arch,
        "cpu": cpu_brand,
        "cpuCores": cpu_count,
        "totalRam": total_ram,
        "availableRam": available_ram,
        "usedRam": used_ram,
        "totalDisk": total_disk,
        "usedDisk": used_disk,
        "freeDisk": available_disk,
    });
    
    Ok(info)
}

// Commande pour obtenir l'espace disque d'un dossier spécifique
#[tauri::command]
async fn get_folder_size(path: String) -> Result<u64, String> {
    use std::fs;
    
    fn dir_size(path: &std::path::Path) -> std::io::Result<u64> {
        let mut size = 0;
        
        if path.is_dir() {
            for entry in fs::read_dir(path)? {
                let entry = entry?;
                let path = entry.path();
                
                if path.is_file() {
                    size += entry.metadata()?.len();
                } else if path.is_dir() {
                    size += dir_size(&path)?;
                }
            }
        }
        
        Ok(size)
    }
    
    let path = std::path::Path::new(&path);
    let size = dir_size(path).map_err(|e| e.to_string())?;
    
    // Retourner la taille en MB
    Ok(size / 1024 / 1024)
}

// Commande pour obtenir le chemin AppData
#[tauri::command]
async fn get_app_data_path() -> Result<String, String> {
    use std::env;
    
    let app_data = env::var("APPDATA").map_err(|e| e.to_string())?;
    let nether_path = format!("{}\\NetherClient", app_data);
    
    Ok(nether_path)
}

// Commande pour vider le cache
#[tauri::command]
async fn clear_cache(path: String) -> Result<(), String> {
    use std::fs;
    
    fn remove_dir_contents(path: &std::path::Path) -> std::io::Result<()> {
        if path.is_dir() {
            for entry in fs::read_dir(path)? {
                let entry = entry?;
                let path = entry.path();
                
                if path.is_file() {
                    fs::remove_file(path)?;
                } else if path.is_dir() {
                    fs::remove_dir_all(path)?;
                }
            }
        }
        Ok(())
    }
    
    let path = std::path::Path::new(&path);
    remove_dir_contents(path).map_err(|e| e.to_string())?;
    
    Ok(())
}

// Commande pour vérifier si Playit.gg est installé
#[tauri::command]
async fn check_playit_installation() -> Result<bool, String> {
    use std::env;
    use std::path::PathBuf;
    
    let app_data = env::var("APPDATA").map_err(|e| e.to_string())?;
    let playit_path = PathBuf::from(app_data)
        .join("NetherClient")
        .join("playit")
        .join("playit.exe");
    
    let exists = playit_path.exists();
    
    if exists {
        // Vérifier aussi que le fichier est exécutable
        let metadata = std::fs::metadata(&playit_path)
            .map_err(|e| format!("Erreur lecture métadonnées: {}", e))?;
        
        println!("Playit.gg trouvé: {} (taille: {} octets)", 
            playit_path.display(), 
            metadata.len()
        );
    } else {
        println!("Playit.gg non trouvé: {}", playit_path.display());
    }
    
    Ok(exists)
}

// Commande pour télécharger et installer Playit.gg
#[tauri::command]
async fn install_playit() -> Result<String, String> {
    use std::env;
    use std::path::PathBuf;
    use std::fs;
    use std::io::Write;
    
    println!("Début de l'installation de Playit.gg...");
    
    // Créer le dossier de destination
    let app_data = env::var("APPDATA").map_err(|e| e.to_string())?;
    let playit_dir = PathBuf::from(&app_data)
        .join("NetherClient")
        .join("playit");
    
    fs::create_dir_all(&playit_dir).map_err(|e| e.to_string())?;
    
    // URL de téléchargement de Playit.gg pour Windows
    let download_url = "https://github.com/playit-cloud/playit-agent/releases/latest/download/playit-windows-x86_64.exe";
    
    println!("Téléchargement depuis: {}", download_url);
    
    // Télécharger le fichier
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(300))
        .build()
        .map_err(|e| e.to_string())?;
    
    let response = client
        .get(download_url)
        .send()
        .await
        .map_err(|e| format!("Erreur lors du téléchargement: {}", e))?;
    
    if !response.status().is_success() {
        return Err(format!("Erreur HTTP: {}", response.status()));
    }
    
    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Erreur lors de la lecture des données: {}", e))?;
    
    println!("Téléchargement terminé: {} octets", bytes.len());
    
    // Sauvegarder le fichier
    let playit_exe = playit_dir.join("playit.exe");
    let mut file = fs::File::create(&playit_exe)
        .map_err(|e| format!("Erreur lors de la création du fichier: {}", e))?;
    
    file.write_all(&bytes)
        .map_err(|e| format!("Erreur lors de l'écriture du fichier: {}", e))?;
    
    println!("Installation terminée: {}", playit_exe.display());
    
    Ok(playit_exe.to_string_lossy().to_string())
}

// Commande pour tester le lancement de Playit.gg (diagnostic)
#[tauri::command]
async fn test_playit_launch() -> Result<String, String> {
    use std::env;
    use std::path::PathBuf;
    
    let app_data = env::var("APPDATA").map_err(|e| e.to_string())?;
    let playit_path = PathBuf::from(app_data)
        .join("NetherClient")
        .join("playit")
        .join("playit.exe");
    
    if !playit_path.exists() {
        return Err("Playit.gg n'est pas installé".to_string());
    }
    
    // Tester l'exécution directe
    let output = Command::new(&playit_path)
        .arg("--help")
        .output()
        .map_err(|e| format!("Erreur test exécution: {}", e))?;
    
    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    
    Ok(format!(
        "Test Playit.gg réussi!\n\
        Chemin: {}\n\
        Sortie: {}\n\
        Erreurs: {}",
        playit_path.display(),
        stdout,
        stderr
    ))
}

// Commande pour démarrer Playit.gg
// Commande pour obtenir le statut détaillé de Playit.gg
#[tauri::command]
async fn get_playit_detailed_status() -> Result<serde_json::Value, String> {
    let mut result = serde_json::json!({
        "running": false,
        "tunnel_url": null,
        "pid": null,
        "status": "stopped"
    });
    
    // Vérifier si Playit.gg est vraiment en cours d'exécution
    let is_running = is_playit_running().await.unwrap_or(false);
    result["running"] = serde_json::Value::Bool(is_running);
    
    if is_running {
        result["status"] = serde_json::Value::String("running".to_string());
        
        // Essayer de récupérer le PID
        #[cfg(target_os = "windows")]
        {
            let output = Command::new("tasklist")
                .args(["/FI", "IMAGENAME eq playit.exe", "/FO", "CSV"])
                .output();
            
            if let Ok(output) = output {
                let output_str = String::from_utf8_lossy(&output.stdout);
                for line in output_str.lines() {
                    if line.contains("playit.exe") {
                        let parts: Vec<&str> = line.split(',').collect();
                        if parts.len() > 1 {
                            if let Ok(pid) = parts[1].trim_matches('"').parse::<u32>() {
                                result["pid"] = serde_json::Value::Number(pid.into());
                                break;
                            }
                        }
                    }
                }
            }
        }
        
        // Utiliser seulement l'URL stockée (pas de détection automatique)
        let tunnel_url = PLAYIT_TUNNEL_URL.lock().unwrap();
        if let Some(ref url) = *tunnel_url {
            result["tunnel_url"] = serde_json::Value::String(url.clone());
            result["status"] = serde_json::Value::String("tunnel_active".to_string());
        }
    } else {
        result["status"] = serde_json::Value::String("stopped".to_string());
    }
    
    Ok(result)
}

// Commande pour récupérer les logs d'un serveur depuis la mémoire (capture en temps réel)
#[tauri::command]
async fn get_server_logs(server_name: String) -> Result<Vec<String>, String> {
    use std::env;
    use std::path::PathBuf;
    use std::fs;
    
    let mut all_logs = Vec::new();
    
    // Récupérer les logs en mémoire (temps réel)
    {
        let logs = SERVER_LOGS.lock().unwrap();
        if let Some(server_logs) = logs.get(&server_name) {
            all_logs.extend(server_logs.clone());
        }
    }
    
    // Toujours essayer de lire le fichier latest.log pour avoir l'historique complet
    let app_data = env::var("APPDATA").map_err(|e| e.to_string())?;
    let logs_path = PathBuf::from(&app_data)
        .join("NetherClient")
        .join("Serveurs")
        .join(&server_name)
        .join("logs")
        .join("latest.log");
    
    if logs_path.exists() {
        match fs::read_to_string(&logs_path) {
            Ok(content) => {
                let file_lines: Vec<String> = content.lines().map(|s| s.to_string()).collect();
                
                // Si on a des logs en mémoire, on les combine avec les logs du fichier
                if !all_logs.is_empty() {
                    // Prendre les dernières lignes du fichier qui ne sont pas déjà en mémoire
                    let memory_count = all_logs.len();
                    let file_count = file_lines.len();
                    
                    if file_count > memory_count {
                        let start = file_count - memory_count;
                        all_logs.extend(file_lines[start..].to_vec());
                    }
                } else {
                    // Si pas de logs en mémoire, prendre les 200 dernières lignes du fichier
                    let start = if file_lines.len() > 200 { file_lines.len() - 200 } else { 0 };
                    all_logs.extend(file_lines[start..].to_vec());
                }
            }
            Err(e) => {
                println!("Erreur lecture fichier logs: {}", e);
            }
        }
    }
    
    if all_logs.is_empty() {
        Ok(vec!["En attente des logs du serveur...".to_string()])
    } else {
        Ok(all_logs)
    }
}

// Commande pour effacer les logs d'un serveur
#[tauri::command]
async fn clear_server_logs(server_name: String) -> Result<(), String> {
    let mut logs = SERVER_LOGS.lock().unwrap();
    logs.remove(&server_name);
    Ok(())
}

// Commande pour corriger le script start.bat d'un serveur existant
#[tauri::command]
async fn fix_server_start_script(server_name: String) -> Result<(), String> {
    use std::env;
    use std::path::PathBuf;
    use std::fs;
    
    let app_data = env::var("APPDATA").map_err(|e| e.to_string())?;
    let server_path = PathBuf::from(&app_data)
        .join("NetherClient")
        .join("Serveurs")
        .join(&server_name);
    
    let bat_path = server_path.join("start.bat");
    
    if !bat_path.exists() {
        return Err(format!("Script start.bat non trouvé pour le serveur {}", server_name));
    }
    
    // Créer un nouveau script start.bat amélioré
    let bat_content = format!(
        "@echo off\n\
         title Nether Client - {}\n\
         echo Demarrage du serveur MohistMC {}...\n\
         echo Utilisation de Java: C:\\Program Files\\Common Files\\Oracle\\Java\\javapath\\bin\\java.exe\n\
         echo.\n\
         echo [INFO] Lancement du serveur...\n\
         \"C:\\Program Files\\Common Files\\Oracle\\Java\\javapath\\bin\\java.exe\" -Xmx4G -Xms2G -jar mohist-1.12.2-server.jar nogui\n\
         if %ERRORLEVEL% neq 0 (\n\
             echo [ERROR] Erreur lors du demarrage du serveur (Code: %ERRORLEVEL%)\n\
         )\n\
         echo.\n\
         echo [INFO] Serveur arrete. Appuyez sur une touche pour fermer...\n\
         pause >nul\n",
        server_name, server_name
    );
    
    // Écrire le nouveau script
    fs::write(&bat_path, bat_content)
        .map_err(|e| format!("Erreur écriture start.bat: {}", e))?;
    
    println!("Script start.bat corrigé pour le serveur: {}", server_name);
    Ok(())
}

// Commande pour corriger la configuration réseau d'un serveur existant
#[tauri::command]
async fn fix_server_network(server_name: String) -> Result<(), String> {
    use std::env;
    use std::path::PathBuf;
    use std::fs;
    
    let app_data = env::var("APPDATA").map_err(|e| e.to_string())?;
    let server_path = PathBuf::from(&app_data)
        .join("NetherClient")
        .join("Serveurs")
        .join(&server_name);
    
    let properties_path = server_path.join("server.properties");
    
    if !properties_path.exists() {
        return Err(format!("Fichier server.properties non trouvé pour le serveur {}", server_name));
    }
    
    // Lire le fichier existant
    let mut content = fs::read_to_string(&properties_path)
        .map_err(|e| format!("Erreur lecture properties: {}", e))?;
    
    // Corriger l'IP du serveur
    if content.contains("server-ip=") {
        // Remplacer l'IP existante par 0.0.0.0
        let lines: Vec<&str> = content.lines().collect();
        let mut new_lines = Vec::new();
        
        for line in lines {
            if line.starts_with("server-ip=") {
                new_lines.push("server-ip=0.0.0.0");
            } else {
                new_lines.push(line);
            }
        }
        
        content = new_lines.join("\n");
    } else {
        // Ajouter la ligne si elle n'existe pas
        content = format!("{}\nserver-ip=0.0.0.0", content);
    }
    
    // Écrire le fichier corrigé
    fs::write(&properties_path, content)
        .map_err(|e| format!("Erreur écriture properties: {}", e))?;
    
    println!("Configuration réseau corrigée pour le serveur: {}", server_name);
    Ok(())
}

// Commande pour envoyer une commande au serveur via stdin
// Fonction helper pour obtenir le nom du serveur à partir du chemin
fn get_server_name_from_path(server_path: &str) -> String {
    use std::path::PathBuf;
    let path = PathBuf::from(server_path);
    path.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or(server_path)
        .to_string()
}

#[tauri::command]
async fn send_server_command(server_name: String, command: String) -> Result<(), String> {
    println!("=== ENVOI COMMANDE ===");
    println!("Serveur: {}", server_name);
    println!("Commande: '{}'", command);
    println!("Longueur: {} caractères", command.len());
    
    let mut processes = SERVER_PROCESSES.lock().unwrap();
    
    // Vérifier si le serveur existe
    if !processes.contains_key(&server_name) {
        println!("ERREUR: Serveur '{}' non trouvé dans les processus", server_name);
        return Err(format!("Serveur '{}' non trouvé. Assurez-vous qu'il est démarré.", server_name));
    }
    
    if let Some(server_process) = processes.get_mut(&server_name) {
        if let Some(stdin) = &mut server_process.stdin {
            println!("Envoi de la commande via stdin...");
            
            stdin.write_all(format!("{}\n", command).as_bytes())
                .map_err(|e| {
                    println!("ERREUR écriture stdin: {}", e);
                    format!("Erreur envoi commande: {}", e)
                })?;
            stdin.flush()
                .map_err(|e| {
                    println!("ERREUR flush stdin: {}", e);
                    format!("Erreur flush stdin: {}", e)
                })?;
            
            println!("Commande envoyée avec succès!");
            
            // Ajouter la commande dans les logs
            let mut logs = SERVER_LOGS.lock().unwrap();
            if let Some(server_logs) = logs.get_mut(&server_name) {
                server_logs.push(format!("> {}", command));
                if server_logs.len() > 500 {
                    server_logs.remove(0);
                }
            }
            
            Ok(())
        } else {
            println!("ERREUR: Stdin non disponible pour le serveur '{}'", server_name);
            Err(format!("Stdin non disponible pour le serveur '{}'. Le serveur n'est peut-être pas démarré correctement.", server_name))
        }
    } else {
        println!("ERREUR: Processus serveur non trouvé");
        Err(format!("Processus serveur '{}' non trouvé", server_name))
    }
}

// Structure pour les statistiques d'un serveur
#[derive(Debug, Serialize, Deserialize)]
struct ServerStats {
    cpu_usage: f32,
    memory_usage: u64,
    memory_total: u64,
    uptime: u64,
}

// Commande pour obtenir les statistiques CPU/RAM d'un serveur
#[tauri::command]
async fn get_server_stats(server_name: String) -> Result<ServerStats, String> {
    use sysinfo::{System, Pid};
    
    let processes = SERVER_PROCESSES.lock().unwrap();
    
    if let Some(server_process) = processes.get(&server_name) {
        let pid = server_process.child.id();
        
        let mut sys = System::new_all();
        sys.refresh_all();
        
        if let Some(process) = sys.process(Pid::from_u32(pid)) {
            let cpu_usage = process.cpu_usage();
            let memory_usage = process.memory();
            let memory_total = sys.total_memory();
            let uptime = process.run_time();
            
            Ok(ServerStats {
                cpu_usage,
                memory_usage,
                memory_total,
                uptime,
            })
        } else {
            Err(format!("Processus {} non trouvé dans le système", pid))
        }
    } else {
        Err(format!("Serveur {} non trouvé ou arrêté", server_name))
    }
}

// Structure pour représenter un mod
#[derive(Debug, Serialize, Deserialize)]
struct ModInfo {
    name: String,
    size: u64,
    enabled: bool,
}

// Commande pour lister les mods d'un serveur
#[tauri::command]
async fn list_server_mods(server_path: String) -> Result<Vec<ModInfo>, String> {
    use std::path::PathBuf;
    use std::fs;
    
    let mods_path = PathBuf::from(&server_path).join("mods");
    
    if !mods_path.exists() {
        fs::create_dir_all(&mods_path)
            .map_err(|e| format!("Erreur création dossier mods: {}", e))?;
        return Ok(Vec::new());
    }
    
    let mut mods = Vec::new();
    
    for entry in fs::read_dir(&mods_path).map_err(|e| format!("Erreur lecture mods: {}", e))? {
        let entry = entry.map_err(|e| format!("Erreur entrée: {}", e))?;
        let path = entry.path();
        
        if path.is_file() {
            let name = path.file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("unknown")
                .to_string();
            
            let size = entry.metadata()
                .map(|m| m.len())
                .unwrap_or(0);
            
            let enabled = !name.ends_with(".disabled");
            
            mods.push(ModInfo {
                name,
                size,
                enabled,
            });
        }
    }
    
    Ok(mods)
}

// Commande pour activer/désactiver un mod
#[tauri::command]
async fn toggle_mod(server_path: String, mod_name: String, enabled: bool) -> Result<(), String> {
    use std::path::PathBuf;
    use std::fs;
    
    let mods_path = PathBuf::from(&server_path).join("mods");
    let old_path = mods_path.join(&mod_name);
    
    if !old_path.exists() {
        return Err(format!("Mod {} non trouvé", mod_name));
    }
    
    let new_name = if enabled {
        mod_name.trim_end_matches(".disabled").to_string()
    } else {
        if mod_name.ends_with(".disabled") {
            mod_name
        } else {
            format!("{}.disabled", mod_name)
        }
    };
    
    let new_path = mods_path.join(&new_name);
    
    fs::rename(&old_path, &new_path)
        .map_err(|e| format!("Erreur renommage mod: {}", e))?;
    
    Ok(())
}

// Commande pour supprimer un mod
#[tauri::command]
async fn delete_mod(server_path: String, mod_name: String) -> Result<(), String> {
    use std::path::PathBuf;
    use std::fs;
    
    let mod_path = PathBuf::from(&server_path).join("mods").join(&mod_name);
    
    if !mod_path.exists() {
        return Err(format!("Mod {} non trouvé", mod_name));
    }
    
    fs::remove_file(&mod_path)
        .map_err(|e| format!("Erreur suppression mod: {}", e))?;
    
    Ok(())
}

// Commande pour copier un mod dans le dossier mods
#[tauri::command]
async fn add_mod(server_path: String, mod_file_path: String) -> Result<(), String> {
    use std::path::PathBuf;
    use std::fs;
    
    let source = PathBuf::from(&mod_file_path);
    
    if !source.exists() {
        return Err(format!("Fichier {} non trouvé", mod_file_path));
    }
    
    let mods_path = PathBuf::from(&server_path).join("mods");
    
    if !mods_path.exists() {
        fs::create_dir_all(&mods_path)
            .map_err(|e| format!("Erreur création dossier mods: {}", e))?;
    }
    
    let file_name = source.file_name()
        .and_then(|n| n.to_str())
        .ok_or("Nom de fichier invalide")?;
    
    let destination = mods_path.join(file_name);
    
    fs::copy(&source, &destination)
        .map_err(|e| format!("Erreur copie mod: {}", e))?;
    
    Ok(())
}

// Ajouter un mod depuis des bytes (pour marketplace)
#[tauri::command]
async fn add_mod_from_bytes(
    server_path: String,
    mod_name: String,
    mod_bytes_base64: String,
) -> Result<(), String> {
    use std::path::PathBuf;
    use std::fs;
    use base64::{Engine as _, engine::general_purpose};
    
    let mods_path = PathBuf::from(&server_path).join("mods");
    
    if !mods_path.exists() {
        fs::create_dir_all(&mods_path)
            .map_err(|e| format!("Erreur création dossier mods: {}", e))?;
    }
    
    // Décoder le base64
    let bytes = general_purpose::STANDARD
        .decode(&mod_bytes_base64)
        .map_err(|e| format!("Erreur décodage base64: {}", e))?;
    
    // Sauvegarder le fichier
    let destination = mods_path.join(&mod_name);
    fs::write(&destination, bytes)
        .map_err(|e| format!("Erreur écriture mod: {}", e))?;
    
    println!("Mod {} installé avec succès", mod_name);
    
    Ok(())
}

// Structure pour représenter un backup
#[derive(Debug, Serialize, Deserialize)]
struct BackupInfo {
    name: String,
    date: String,
    size: u64,
}

// Commande pour créer un backup d'un serveur
#[tauri::command]
async fn create_backup(server_name: String, server_path: String) -> Result<String, String> {
    use std::path::PathBuf;
    use std::fs;
    use std::env;
    use chrono::Local;
    
    let timestamp = Local::now().format("%Y-%m-%d_%H-%M-%S").to_string();
    let backup_name = format!("{}_{}", server_name, timestamp);
    
    let app_data = env::var("APPDATA").map_err(|e| e.to_string())?;
    let backups_path = PathBuf::from(&app_data)
        .join("NetherClient")
        .join("backups");
    
    fs::create_dir_all(&backups_path)
        .map_err(|e| format!("Erreur création dossier backups: {}", e))?;
    
    let backup_file = backups_path.join(format!("{}.zip", backup_name));
    
    // Créer l'archive ZIP
    let file = fs::File::create(&backup_file)
        .map_err(|e| format!("Erreur création backup: {}", e))?;
    
    let mut zip = zip::ZipWriter::new(file);
    let options = zip::write::FileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .unix_permissions(0o755);
    
    // Ajouter tous les fichiers du serveur au ZIP
    let server_path_buf = PathBuf::from(&server_path);
    add_directory_to_zip(&mut zip, &server_path_buf, &server_path_buf, options)?;
    
    zip.finish().map_err(|e| format!("Erreur finalisation ZIP: {}", e))?;
    
    println!("Backup créé: {}", backup_file.display());
    
    Ok(backup_name)
}

// Fonction helper pour ajouter un dossier au ZIP
fn add_directory_to_zip<W: std::io::Write + std::io::Seek>(
    zip: &mut zip::ZipWriter<W>,
    path: &std::path::Path,
    base_path: &std::path::Path,
    options: zip::write::FileOptions,
) -> Result<(), String> {
    use std::fs;
    use std::io::Read;
    
    if path.is_dir() {
        for entry in fs::read_dir(path).map_err(|e| format!("Erreur lecture dossier: {}", e))? {
            let entry = entry.map_err(|e| format!("Erreur entrée: {}", e))?;
            let entry_path = entry.path();
            
            // Ignorer certains dossiers
            if let Some(name) = entry_path.file_name().and_then(|n| n.to_str()) {
                if name == "logs" || name == "crash-reports" || name == "cache" {
                    continue;
                }
            }
            
            add_directory_to_zip(zip, &entry_path, base_path, options)?;
        }
    } else if path.is_file() {
        let relative_path = path.strip_prefix(base_path)
            .map_err(|e| format!("Erreur chemin relatif: {}", e))?;
        
        let zip_path = relative_path.to_str()
            .ok_or("Chemin invalide")?;
        
        zip.start_file(zip_path, options)
            .map_err(|e| format!("Erreur ajout fichier au ZIP: {}", e))?;
        
        let mut file = fs::File::open(path)
            .map_err(|e| format!("Erreur ouverture fichier: {}", e))?;
        
        let mut buffer = Vec::new();
        file.read_to_end(&mut buffer)
            .map_err(|e| format!("Erreur lecture fichier: {}", e))?;
        
        zip.write_all(&buffer)
            .map_err(|e| format!("Erreur écriture ZIP: {}", e))?;
    }
    
    Ok(())
}

// Commande pour lister les backups disponibles
#[tauri::command]
async fn list_backups() -> Result<Vec<BackupInfo>, String> {
    use std::path::PathBuf;
    use std::fs;
    use std::env;
    
    let app_data = env::var("APPDATA").map_err(|e| e.to_string())?;
    let backups_path = PathBuf::from(&app_data)
        .join("NetherClient")
        .join("backups");
    
    if !backups_path.exists() {
        return Ok(Vec::new());
    }
    
    let mut backups = Vec::new();
    
    for entry in fs::read_dir(&backups_path).map_err(|e| format!("Erreur lecture backups: {}", e))? {
        let entry = entry.map_err(|e| format!("Erreur entrée: {}", e))?;
        let path = entry.path();
        
        if path.is_file() && path.extension().and_then(|e| e.to_str()) == Some("zip") {
            let name = path.file_stem()
                .and_then(|n| n.to_str())
                .unwrap_or("unknown")
                .to_string();
            
            let metadata = entry.metadata()
                .map_err(|e| format!("Erreur métadonnées: {}", e))?;
            
            let size = metadata.len();
            
            let date = metadata.modified()
                .ok()
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| {
                    let datetime = chrono::DateTime::<chrono::Utc>::from(std::time::UNIX_EPOCH + d);
                    datetime.format("%Y-%m-%d %H:%M:%S").to_string()
                })
                .unwrap_or_else(|| "Unknown".to_string());
            
            backups.push(BackupInfo {
                name,
                date,
                size,
            });
        }
    }
    
    // Trier par date (plus récent en premier)
    backups.sort_by(|a, b| b.date.cmp(&a.date));
    
    Ok(backups)
}

// Commande pour restaurer un backup
#[tauri::command]
async fn restore_backup(backup_name: String, server_name: String) -> Result<(), String> {
    use std::path::PathBuf;
    use std::fs;
    use std::env;
    
    let app_data = env::var("APPDATA").map_err(|e| e.to_string())?;
    let backup_file = PathBuf::from(&app_data)
        .join("NetherClient")
        .join("backups")
        .join(format!("{}.zip", backup_name));
    
    if !backup_file.exists() {
        return Err(format!("Backup {} non trouvé", backup_name));
    }
    
    let restore_path = PathBuf::from(&app_data)
        .join("NetherClient")
        .join("Serveurs")
        .join(&server_name);
    
    // Supprimer le dossier existant si présent
    if restore_path.exists() {
        fs::remove_dir_all(&restore_path)
            .map_err(|e| format!("Erreur suppression ancien serveur: {}", e))?;
    }
    
    fs::create_dir_all(&restore_path)
        .map_err(|e| format!("Erreur création dossier: {}", e))?;
    
    // Extraire le ZIP
    let file = fs::File::open(&backup_file)
        .map_err(|e| format!("Erreur ouverture backup: {}", e))?;
    
    let mut archive = zip::ZipArchive::new(file)
        .map_err(|e| format!("Erreur lecture ZIP: {}", e))?;
    
    for i in 0..archive.len() {
        let mut file = archive.by_index(i)
            .map_err(|e| format!("Erreur extraction fichier: {}", e))?;
        
        let outpath = restore_path.join(file.name());
        
        if file.is_dir() {
            fs::create_dir_all(&outpath)
                .map_err(|e| format!("Erreur création dossier: {}", e))?;
        } else {
            if let Some(parent) = outpath.parent() {
                fs::create_dir_all(parent)
                    .map_err(|e| format!("Erreur création parent: {}", e))?;
            }
            
            let mut outfile = fs::File::create(&outpath)
                .map_err(|e| format!("Erreur création fichier: {}", e))?;
            
            std::io::copy(&mut file, &mut outfile)
                .map_err(|e| format!("Erreur copie fichier: {}", e))?;
        }
    }
    
    println!("Backup restauré: {}", backup_name);
    
    Ok(())
}

// Commande pour supprimer un backup
#[tauri::command]
async fn delete_backup(backup_name: String) -> Result<(), String> {
    use std::path::PathBuf;
    use std::fs;
    use std::env;
    
    let app_data = env::var("APPDATA").map_err(|e| e.to_string())?;
    let backup_file = PathBuf::from(&app_data)
        .join("NetherClient")
        .join("backups")
        .join(format!("{}.zip", backup_name));
    
    if !backup_file.exists() {
        return Err(format!("Backup {} non trouvé", backup_name));
    }
    
    fs::remove_file(&backup_file)
        .map_err(|e| format!("Erreur suppression backup: {}", e))?;
    
    Ok(())
}

// Commande pour activer les backups automatiques
#[tauri::command]
async fn enable_auto_backup(enabled: bool, interval_hours: u64) -> Result<(), String> {
    let mut auto_enabled = AUTO_BACKUP_ENABLED.lock().unwrap();
    let mut auto_interval = AUTO_BACKUP_INTERVAL.lock().unwrap();
    
    *auto_enabled = enabled;
    *auto_interval = interval_hours;
    
    if enabled {
        start_backup_scheduler(interval_hours);
    } else {
        stop_backup_scheduler();
    }
    
    Ok(())
}

// Démarrer le scheduler de backups
fn start_backup_scheduler(interval_hours: u64) {
    use std::time::Duration;
    
    let mut scheduler = BACKUP_SCHEDULER.lock().unwrap();
    
    // Arrêter l'ancien scheduler s'il existe
    if scheduler.is_some() {
        stop_backup_scheduler();
    }
    
    let handle = thread::spawn(move || {
        loop {
            thread::sleep(Duration::from_secs(interval_hours * 3600));
            
            // Vérifier si toujours activé
            let enabled = *AUTO_BACKUP_ENABLED.lock().unwrap();
            if !enabled {
                break;
            }
            
            // Créer un backup de tous les serveurs
            println!("Exécution du backup automatique...");
            
            // Lire la liste des serveurs depuis AppData
            if let Ok(app_data) = std::env::var("APPDATA") {
                let servers_path = std::path::PathBuf::from(&app_data)
                    .join("NetherClient")
                    .join("Serveurs");
                
                if let Ok(entries) = std::fs::read_dir(&servers_path) {
                    for entry in entries.flatten() {
                        if entry.path().is_dir() {
                            let server_name = entry.file_name().to_string_lossy().to_string();
                            let server_path = entry.path().to_string_lossy().to_string();
                            
                            // Créer le backup (version synchrone pour le thread)
                            match create_backup_sync(&server_name, &server_path) {
                                Ok(backup_name) => {
                                    println!("Backup automatique créé: {}", backup_name);
                                }
                                Err(e) => {
                                    eprintln!("Erreur backup automatique pour {}: {}", server_name, e);
                                }
                            }
                        }
                    }
                }
            }
            
            // Nettoyer les vieux backups (garder les 10 derniers)
            cleanup_old_backups(10);
        }
    });
    
    *scheduler = Some(handle);
}

// Arrêter le scheduler
fn stop_backup_scheduler() {
    let mut scheduler = BACKUP_SCHEDULER.lock().unwrap();
    *scheduler = None;
}

// Version synchrone de create_backup pour le scheduler
fn create_backup_sync(server_name: &str, server_path: &str) -> Result<String, String> {
    use std::path::PathBuf;
    use std::fs;
    use std::env;
    use chrono::Local;
    
    let timestamp = Local::now().format("%Y-%m-%d_%H-%M-%S").to_string();
    let backup_name = format!("{}_{}", server_name, timestamp);
    
    let app_data = env::var("APPDATA").map_err(|e| e.to_string())?;
    let backups_path = PathBuf::from(&app_data)
        .join("NetherClient")
        .join("backups");
    
    fs::create_dir_all(&backups_path)
        .map_err(|e| format!("Erreur création dossier backups: {}", e))?;
    
    let backup_file = backups_path.join(format!("{}.zip", backup_name));
    
    let file = fs::File::create(&backup_file)
        .map_err(|e| format!("Erreur création backup: {}", e))?;
    
    let mut zip = zip::ZipWriter::new(file);
    let options = zip::write::FileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .unix_permissions(0o755);
    
    let server_path_buf = PathBuf::from(server_path);
    add_directory_to_zip(&mut zip, &server_path_buf, &server_path_buf, options)?;
    
    zip.finish().map_err(|e| format!("Erreur finalisation ZIP: {}", e))?;
    
    Ok(backup_name)
}

// Nettoyer les vieux backups
fn cleanup_old_backups(keep_count: usize) {
    use std::path::PathBuf;
    use std::fs;
    use std::env;
    
    if let Ok(app_data) = env::var("APPDATA") {
        let backups_path = PathBuf::from(&app_data)
            .join("NetherClient")
            .join("backups");
        
        if let Ok(entries) = fs::read_dir(&backups_path) {
            let mut backups: Vec<_> = entries
                .flatten()
                .filter(|e| e.path().extension().and_then(|s| s.to_str()) == Some("zip"))
                .collect();
            
            // Trier par date de modification (plus récent en premier)
            backups.sort_by(|a, b| {
                let a_time = a.metadata().and_then(|m| m.modified()).ok();
                let b_time = b.metadata().and_then(|m| m.modified()).ok();
                b_time.cmp(&a_time)
            });
            
            // Supprimer les backups au-delà de keep_count
            for backup in backups.iter().skip(keep_count) {
                let _ = fs::remove_file(backup.path());
                println!("Backup ancien supprimé: {:?}", backup.file_name());
            }
        }
    }
}

// ========== COMMANDES D'AUTOMATISATION ==========

// Activer/désactiver le redémarrage automatique en cas de crash
#[tauri::command]
async fn enable_auto_restart(server_name: String, enabled: bool) -> Result<(), String> {
    let mut auto_restart = AUTO_RESTART_ENABLED.lock().unwrap();
    auto_restart.insert(server_name, enabled);
    Ok(())
}

// Obtenir un port disponible automatiquement
#[tauri::command]
async fn get_available_port() -> Result<u16, String> {
    let mut next_port = NEXT_AVAILABLE_PORT.lock().unwrap();
    let port = automation::find_available_port(*next_port)?;
    *next_port = port + 1;
    Ok(port)
}

// Télécharger Java automatiquement
#[tauri::command]
async fn download_java_runtime(version: u8) -> Result<String, String> {
    automation::download_java(version).await
}

// Vérifier la version de Java installée
#[tauri::command]
async fn check_java_version() -> Result<Option<String>, String> {
    Ok(automation::check_java_version())
}

// Commande pour détecter toutes les versions Java installées
#[tauri::command]
async fn detect_java_versions() -> Result<Vec<serde_json::Value>, String> {
    use std::process::Command;
    use std::path::PathBuf;
    use std::fs;
    
    let mut java_versions = Vec::new();
    
    // 1. Vérifier dans Program Files\Java
    let program_files = std::env::var("PROGRAMFILES").unwrap_or_else(|_| "C:\\Program Files".to_string());
    let java_path = PathBuf::from(&program_files).join("Java");
    
    if java_path.exists() {
        if let Ok(entries) = fs::read_dir(&java_path) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    if let Some(dir_name) = path.file_name().and_then(|n| n.to_str()) {
                        if dir_name.starts_with("jdk") || dir_name.starts_with("jre") {
                            if let Some(version) = extract_java_version_from_path(&path) {
                                java_versions.push(serde_json::json!({
                                    "path": path.to_string_lossy().to_string(),
                                    "version": version,
                                    "type": if dir_name.starts_with("jdk") { "JDK" } else { "JRE" },
                                    "source": "Program Files"
                                }));
                            }
                        }
                    }
                }
            }
        }
    }
    
    // 2. Vérifier dans Program Files (x86)\Java
    let program_files_x86 = std::env::var("PROGRAMFILES(X86)").unwrap_or_else(|_| "C:\\Program Files (x86)".to_string());
    let java_path_x86 = PathBuf::from(&program_files_x86).join("Java");
    
    if java_path_x86.exists() {
        if let Ok(entries) = fs::read_dir(&java_path_x86) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    if let Some(dir_name) = path.file_name().and_then(|n| n.to_str()) {
                        if dir_name.starts_with("jdk") || dir_name.starts_with("jre") {
                            if let Some(version) = extract_java_version_from_path(&path) {
                                java_versions.push(serde_json::json!({
                                    "path": path.to_string_lossy().to_string(),
                                    "version": version,
                                    "type": if dir_name.starts_with("jdk") { "JDK" } else { "JRE" },
                                    "source": "Program Files (x86)"
                                }));
                            }
                        }
                    }
                }
            }
        }
    }
    
    // 3. Vérifier avec "where java" et JAVA_HOME
    if let Ok(output) = Command::new("where").arg("java").output() {
        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines() {
                let java_exe = line.trim();
                if let Some(java_dir) = PathBuf::from(java_exe).parent() {
                    if let Some(version) = get_java_version_from_exe(java_exe) {
                        java_versions.push(serde_json::json!({
                            "path": java_dir.to_string_lossy().to_string(),
                            "version": version,
                            "type": "System",
                            "source": "PATH"
                        }));
                    }
                }
            }
        }
    }
    
    // 4. Vérifier JAVA_HOME
    if let Ok(java_home) = std::env::var("JAVA_HOME") {
        let java_home_path = PathBuf::from(&java_home);
        if java_home_path.exists() {
            if let Some(version) = get_java_version_from_exe(&java_home_path.join("bin").join("java.exe").to_string_lossy()) {
                java_versions.push(serde_json::json!({
                    "path": java_home,
                    "version": version,
                    "type": "JDK",
                    "source": "JAVA_HOME"
                }));
            }
        }
    }
    
    // Trier par version (plus récente en premier)
    java_versions.sort_by(|a, b| {
        let version_a = a["version"].as_str().unwrap_or("0");
        let version_b = b["version"].as_str().unwrap_or("0");
        version_b.cmp(version_a)
    });
    
    Ok(java_versions)
}

// Fonction pour extraire la version Java depuis un chemin
fn extract_java_version_from_path(path: &std::path::Path) -> Option<String> {
    if let Some(dir_name) = path.file_name().and_then(|n| n.to_str()) {
        // Extraire la version depuis le nom du dossier (ex: jdk-21.0.1, jre1.8.0_291)
        if let Some(version_start) = dir_name.find('-') {
            let version_part = &dir_name[version_start + 1..];
            if let Some(version_end) = version_part.find('-') {
                return Some(version_part[..version_end].to_string());
            } else {
                return Some(version_part.to_string());
            }
        } else if dir_name.starts_with("jre") {
            let version_part = &dir_name[3..];
            return Some(version_part.replace('_', "."));
        }
    }
    None
}

// Fonction pour obtenir la version Java depuis un exécutable
fn get_java_version_from_exe(java_exe: &str) -> Option<String> {
    use std::process::Command;
    
    if let Ok(output) = Command::new(java_exe).arg("-version").output() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        if let Some(version_line) = stderr.lines().next() {
            if let Some(version) = version_line.split_whitespace().nth(2) {
                return Some(version.trim_matches('"').to_string());
            }
        }
    }
    None
}

// Commande pour obtenir la version Java recommandée pour une version Minecraft
#[tauri::command]
async fn get_recommended_java_version(minecraft_version: &str) -> Result<String, String> {
    // Logique de recommandation basée sur la version Minecraft
    let version_parts: Vec<&str> = minecraft_version.split('.').collect();
    
    if version_parts.len() >= 2 {
        if let Ok(major) = version_parts[0].parse::<i32>() {
            if let Ok(minor) = version_parts[1].parse::<i32>() {
                // Minecraft 1.21+ nécessite Java 21
                if major > 1 || (major == 1 && minor >= 21) {
                    return Ok("21".to_string());
                }
                // Minecraft 1.17-1.20 nécessite Java 17+
                else if major > 1 || (major == 1 && minor >= 17) {
                    return Ok("17".to_string());
                }
                // Minecraft 1.16 et antérieur fonctionne avec Java 8+
                else {
                    return Ok("8".to_string());
                }
            }
        }
    }
    
    // Par défaut, recommander Java 21 pour les versions récentes
    Ok("21".to_string())
}

// Commande pour sélectionner automatiquement la meilleure version Java
#[tauri::command]
async fn select_best_java_version(minecraft_version: &str) -> Result<Option<serde_json::Value>, String> {
    let recommended_version = get_recommended_java_version(minecraft_version).await?;
    let java_versions = detect_java_versions().await?;
    
    // Chercher la version exacte recommandée
    for java in &java_versions {
        if let Some(version) = java["version"].as_str() {
            if version.starts_with(&recommended_version) {
                return Ok(Some(java.clone()));
            }
        }
    }
    
    // Si pas trouvé, chercher une version supérieure
    let recommended_major: i32 = recommended_version.parse().unwrap_or(21);
    for java in &java_versions {
        if let Some(version) = java["version"].as_str() {
            if let Ok(version_major) = version.split('.').next().unwrap_or("0").parse::<i32>() {
                if version_major >= recommended_major {
                    return Ok(Some(java.clone()));
                }
            }
        }
    }
    
    // Si toujours pas trouvé, prendre la version la plus récente
    if !java_versions.is_empty() {
        return Ok(Some(java_versions[0].clone()));
    }
    
    Ok(None)
}

// Fonction utilitaire pour obtenir le chemin Java correct pour une version Minecraft
async fn get_java_executable_path(minecraft_version: &str) -> Result<String, String> {
    use std::path::PathBuf;
    
    let recommended_version = get_recommended_java_version(minecraft_version).await?;
    let java_versions = detect_java_versions().await?;
    
    // Fonction helper pour construire et vérifier le chemin Java
    let build_and_check_path = |java_path_str: &str| -> Option<String> {
        let java_path = PathBuf::from(java_path_str);
        let java_exe = java_path.join("bin").join("java.exe");
        
        // Normaliser le chemin (convertir en String avec backslashes pour Windows)
        let normalized_path = java_exe.to_string_lossy().replace('/', "\\");
        
        // Vérifier que le fichier existe
        if std::path::Path::new(&normalized_path).exists() {
            println!("✅ Chemin Java trouvé et vérifié: {}", normalized_path);
            Some(normalized_path)
        } else {
            println!("❌ Chemin Java n'existe pas: {}", normalized_path);
            None
        }
    };
    
    // Chercher la version exacte recommandée
    for java in &java_versions {
        if let Some(version) = java["version"].as_str() {
            if version.starts_with(&recommended_version) {
                if let Some(path) = java["path"].as_str() {
                    if let Some(valid_path) = build_and_check_path(path) {
                        return Ok(valid_path);
                    }
                }
            }
        }
    }
    
    // Si pas trouvé, chercher une version supérieure
    let recommended_major: i32 = recommended_version.parse().unwrap_or(21);
    for java in &java_versions {
        if let Some(version) = java["version"].as_str() {
            if let Ok(version_major) = version.split('.').next().unwrap_or("0").parse::<i32>() {
                if version_major >= recommended_major {
                    if let Some(path) = java["path"].as_str() {
                        if let Some(valid_path) = build_and_check_path(path) {
                            return Ok(valid_path);
                        }
                    }
                }
            }
        }
    }
    
    // Si toujours pas trouvé, prendre la version la plus récente
    for java in &java_versions {
        if let Some(path) = java["path"].as_str() {
            if let Some(valid_path) = build_and_check_path(path) {
                return Ok(valid_path);
            }
        }
    }
    
    // Fallback sur java système (dans le PATH)
    println!("⚠️ Aucun chemin Java valide trouvé, utilisation de 'java' depuis le PATH");
    Ok("java".to_string())
}

// Nettoyer les logs anciens d'un serveur
#[tauri::command]
async fn cleanup_server_logs(server_path: String, days_to_keep: u64) -> Result<(), String> {
    automation::cleanup_old_logs(&server_path, days_to_keep)
}

// Nettoyer le cache de l'application
#[tauri::command]
async fn cleanup_app_cache() -> Result<u64, String> {
    automation::cleanup_cache()
}

// Vérifier les mises à jour disponibles pour un serveur
#[tauri::command]
async fn check_updates(version: String, server_type: String) -> Result<Option<String>, String> {
    automation::check_server_updates(&version, &server_type).await
}

// Obtenir les flags Java optimisés
#[tauri::command]
async fn get_optimized_java_flags(ram_mb: u32, version: String, server_type: String) -> Result<Vec<String>, String> {
    Ok(automation::get_optimized_java_flags(ram_mb, &version, &server_type))
}

// Détecter si un serveur a crashé
#[tauri::command]
async fn detect_crash(server_name: String) -> Result<bool, String> {
    let logs = SERVER_LOGS.lock().unwrap();
    
    if let Some(server_logs) = logs.get(&server_name) {
        Ok(automation::detect_crash_in_logs(server_logs))
    } else {
        Ok(false)
    }
}

// ========== GESTION DES JOUEURS (WHITELIST/OPS/BANLIST) ==========

// Ajouter un joueur à une liste (whitelist, ops, banned)
#[tauri::command]
async fn add_player_to_list(server_path: String, player_name: String, list_type: String) -> Result<(), String> {
    use std::path::PathBuf;
    use std::fs;
    use std::io::Write;
    
    let path = PathBuf::from(&server_path);
    let file_name = match list_type.as_str() {
        "whitelist" => "whitelist.json",
        "ops" => "ops.json",
        "banned" => "banned-players.json",
        _ => return Err("Type de liste invalide".to_string()),
    };
    
    let file_path = path.join(file_name);
    
    // Lire le fichier existant ou créer un nouveau tableau
    let mut players: Vec<serde_json::Value> = if file_path.exists() {
        let content = fs::read_to_string(&file_path)
            .map_err(|e| format!("Erreur lecture fichier: {}", e))?;
        serde_json::from_str(&content).unwrap_or_else(|_| Vec::new())
    } else {
        Vec::new()
    };
    
    // Vérifier si le joueur existe déjà
    let player_exists = players.iter().any(|p| {
        p.get("name").and_then(|n| n.as_str()) == Some(&player_name)
    });
    
    if !player_exists {
        let new_player = if list_type == "ops" {
            serde_json::json!({
                "uuid": format!("00000000-0000-0000-0000-{:012}", players.len()),
                "name": player_name,
                "level": 4,
                "bypassesPlayerLimit": false
            })
        } else {
            serde_json::json!({
                "uuid": format!("00000000-0000-0000-0000-{:012}", players.len()),
                "name": player_name
            })
        };
        
        players.push(new_player);
        
        // Écrire le fichier
        let json_content = serde_json::to_string_pretty(&players)
            .map_err(|e| format!("Erreur sérialisation: {}", e))?;
        
        let mut file = fs::File::create(&file_path)
            .map_err(|e| format!("Erreur création fichier: {}", e))?;
        
        file.write_all(json_content.as_bytes())
            .map_err(|e| format!("Erreur écriture: {}", e))?;
        
        // Envoyer la commande au serveur pour appliquer le changement immédiatement
        let command = match list_type.as_str() {
            "whitelist" => format!("whitelist add {}", player_name),
            "ops" => format!("op {}", player_name),
            "banned" => format!("ban {} Cheating", player_name),
            _ => return Err("Type de liste invalide".to_string()),
        };
        
        // Obtenir le nom du serveur à partir du chemin
        let server_name = get_server_name_from_path(&server_path);
        
        // Envoyer la commande au serveur (ignore les erreurs si le serveur n'est pas en cours d'exécution)
        let _ = send_server_command(server_name, command).await;
        
        println!("Joueur {} ajouté à {}", player_name, list_type);
    }
    
    Ok(())
}

// Retirer un joueur d'une liste
#[tauri::command]
async fn remove_player_from_list(server_path: String, player_name: String, list_type: String) -> Result<(), String> {
    use std::path::PathBuf;
    use std::fs;
    use std::io::Write;
    
    let path = PathBuf::from(&server_path);
    let file_name = match list_type.as_str() {
        "whitelist" => "whitelist.json",
        "ops" => "ops.json",
        "banned" => "banned-players.json",
        _ => return Err("Type de liste invalide".to_string()),
    };
    
    let file_path = path.join(file_name);
    
    if !file_path.exists() {
        return Ok(());
    }
    
    // Lire le fichier
    let content = fs::read_to_string(&file_path)
        .map_err(|e| format!("Erreur lecture fichier: {}", e))?;
    
    let mut players: Vec<serde_json::Value> = serde_json::from_str(&content)
        .unwrap_or_else(|_| Vec::new());
    
    // Vérifier si le joueur existe avant de le retirer
    let player_exists = players.iter().any(|p| {
        p.get("name").and_then(|n| n.as_str()) == Some(&player_name)
    });
    
    if player_exists {
        // Filtrer le joueur
        players.retain(|p| {
            p.get("name").and_then(|n| n.as_str()) != Some(&player_name)
        });
        
        // Écrire le fichier
        let json_content = serde_json::to_string_pretty(&players)
            .map_err(|e| format!("Erreur sérialisation: {}", e))?;
        
        let mut file = fs::File::create(&file_path)
            .map_err(|e| format!("Erreur création fichier: {}", e))?;
        
        file.write_all(json_content.as_bytes())
            .map_err(|e| format!("Erreur écriture: {}", e))?;
        
        // Envoyer la commande au serveur pour appliquer le changement immédiatement
        let command = match list_type.as_str() {
            "whitelist" => format!("whitelist remove {}", player_name),
            "ops" => format!("deop {}", player_name),
            "banned" => format!("pardon {}", player_name),
            _ => return Err("Type de liste invalide".to_string()),
        };
        
        // Obtenir le nom du serveur à partir du chemin
        let server_name = get_server_name_from_path(&server_path);
        
        // Envoyer la commande au serveur (ignore les erreurs si le serveur n'est pas en cours d'exécution)
        let _ = send_server_command(server_name, command).await;
        
        println!("Joueur {} retiré de {}", player_name, list_type);
    }
    
    Ok(())
}

// ========== IMPORT/EXPORT MODPACKS ==========

// Importer un modpack depuis un fichier ZIP
#[tauri::command]
async fn import_modpack(server_path: String, modpack_path: String) -> Result<String, String> {
    use std::path::PathBuf;
    use std::fs;
    use zip::ZipArchive;
    
    let server_dir = PathBuf::from(&server_path);
    let modpack_file = PathBuf::from(&modpack_path);
    
    if !modpack_file.exists() {
        return Err("Fichier modpack introuvable".to_string());
    }
    
    // Ouvrir le ZIP
    let file = fs::File::open(&modpack_file)
        .map_err(|e| format!("Erreur ouverture ZIP: {}", e))?;
    
    let mut archive = ZipArchive::new(file)
        .map_err(|e| format!("Erreur lecture ZIP: {}", e))?;
    
    let mods_dir = server_dir.join("mods");
    fs::create_dir_all(&mods_dir)
        .map_err(|e| format!("Erreur création dossier mods: {}", e))?;
    
    let mut mod_count = 0;
    let mut detected_loader = String::from("unknown");
    
    // Extraire les fichiers .jar dans le dossier mods
    for i in 0..archive.len() {
        let mut file = archive.by_index(i)
            .map_err(|e| format!("Erreur extraction fichier: {}", e))?;
        
        let file_name = file.name().to_string();
        
        // Détecter le loader
        if file_name.to_lowercase().contains("forge") {
            detected_loader = "forge".to_string();
        } else if file_name.to_lowercase().contains("neoforge") {
            detected_loader = "neoforge".to_string();
        } else if file_name.to_lowercase().contains("fabric") {
            detected_loader = "fabric".to_string();
        }
        
        // Extraire les .jar
        if file_name.ends_with(".jar") && !file_name.contains("/") {
            let output_path = mods_dir.join(&file_name);
            let mut output_file = fs::File::create(&output_path)
                .map_err(|e| format!("Erreur création fichier: {}", e))?;
            
            std::io::copy(&mut file, &mut output_file)
                .map_err(|e| format!("Erreur copie fichier: {}", e))?;
            
            mod_count += 1;
            println!("Mod extrait: {}", file_name);
        }
    }
    
    Ok(format!("{} mods importés (loader détecté: {})", mod_count, detected_loader))
}

// Exporter les mods d'un serveur en modpack ZIP
#[tauri::command]
async fn export_modpack(server_path: String, output_name: String) -> Result<String, String> {
    use std::path::PathBuf;
    use std::fs;
    use zip::write::FileOptions;
    use zip::ZipWriter;
    use std::io::Write;
    
    let server_dir = PathBuf::from(&server_path);
    let mods_dir = server_dir.join("mods");
    
    if !mods_dir.exists() {
        return Err("Dossier mods introuvable".to_string());
    }
    
    // Créer le fichier ZIP
    let app_data = std::env::var("APPDATA").map_err(|e| e.to_string())?;
    let backups_dir = PathBuf::from(&app_data)
        .join("NetherClient")
        .join("backups");
    
    fs::create_dir_all(&backups_dir)
        .map_err(|e| format!("Erreur création dossier backups: {}", e))?;
    
    let zip_path = backups_dir.join(format!("{}.zip", output_name));
    let zip_file = fs::File::create(&zip_path)
        .map_err(|e| format!("Erreur création ZIP: {}", e))?;
    
    let mut zip = ZipWriter::new(zip_file);
    let options = FileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated);
    
    let mut mod_count = 0;
    
    // Ajouter tous les mods au ZIP
    for entry in fs::read_dir(&mods_dir)
        .map_err(|e| format!("Erreur lecture mods: {}", e))? 
    {
        let entry = entry.map_err(|e| format!("Erreur entrée: {}", e))?;
        let path = entry.path();
        
        if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("jar") {
            let file_name = path.file_name()
                .and_then(|n| n.to_str())
                .ok_or("Nom de fichier invalide")?;
            
            zip.start_file(file_name, options)
                .map_err(|e| format!("Erreur ajout fichier au ZIP: {}", e))?;
            
            let file_content = fs::read(&path)
                .map_err(|e| format!("Erreur lecture mod: {}", e))?;
            
            zip.write_all(&file_content)
                .map_err(|e| format!("Erreur écriture ZIP: {}", e))?;
            
            mod_count += 1;
            println!("Mod ajouté au modpack: {}", file_name);
        }
    }
    
    zip.finish()
        .map_err(|e| format!("Erreur finalisation ZIP: {}", e))?;
    
    Ok(format!("Modpack exporté: {} ({} mods)", zip_path.display(), mod_count))
}

// ========== MISE À JOUR AUTOMATIQUE DES SERVEURS ==========

// Mettre à jour un serveur vers une nouvelle version
#[tauri::command]
async fn update_server(server_name: String, server_path: String, new_version: String, server_type: String) -> Result<String, String> {
    use std::path::PathBuf;
    use std::fs;
    
    println!("Mise à jour du serveur {} vers {}", server_name, new_version);
    
    let server_dir = PathBuf::from(&server_path);
    
    // 1. Créer une sauvegarde avant la mise à jour
    println!("Création d'une sauvegarde de sécurité...");
    let backup_result = create_backup_sync(&server_name, &server_path);
    if let Err(e) = backup_result {
        return Err(format!("Erreur création backup: {}", e));
    }
    
    // 2. Télécharger la nouvelle version selon le type
    println!("Téléchargement de la version {}...", new_version);
    let jar_name = match server_type.as_str() {
        "vanilla" => {
            download_vanilla_jar(&new_version, &server_dir).await?;
            "server.jar"
        },
        "forge" => {
            download_forge_installer(&new_version, &server_dir).await?;
            "forge-installer.jar"
        },
        "neoforge" => {
            download_neoforge_installer(&new_version, &server_dir).await?;
            "neoforge-installer.jar"
        },
        _ => return Err("Type de serveur non supporté".to_string()),
    };
    
    // 3. Sauvegarder l'ancien JAR
    let old_jar = server_dir.join(jar_name);
    if old_jar.exists() {
        let backup_jar = server_dir.join(format!("{}.old", jar_name));
        fs::rename(&old_jar, &backup_jar)
            .map_err(|e| format!("Erreur sauvegarde ancien JAR: {}", e))?;
        println!("Ancien JAR sauvegardé");
    }
    
    // 4. Pour Forge/NeoForge, exécuter l'installeur
    if server_type == "forge" || server_type == "neoforge" {
        println!("Installation du loader...");
        let _installer_path = server_dir.join(jar_name);
        
        let output = Command::new("java")
            .args(["-jar", jar_name, "--installServer"])
            .current_dir(&server_dir)
            .output()
            .map_err(|e| format!("Erreur exécution installeur: {}", e))?;
        
        if !output.status.success() {
            return Err(format!("Erreur installation: {}", String::from_utf8_lossy(&output.stderr)));
        }
        
        println!("Loader installé avec succès");
    }
    
    // 5. Mettre à jour le fichier de configuration
    update_server_version_config(&server_dir, &new_version)?;
    
    Ok(format!("Serveur {} mis à jour vers {} avec succès!", server_name, new_version))
}

// Télécharger un JAR Vanilla
async fn download_vanilla_jar(version: &str, server_dir: &std::path::PathBuf) -> Result<(), String> {
    use std::fs;
    
    let manifest_url = "https://launchermeta.mojang.com/mc/game/version_manifest_v2.json";
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(300))
        .build()
        .map_err(|e| e.to_string())?;
    
    let manifest: serde_json::Value = client
        .get(manifest_url)
        .send()
        .await
        .map_err(|e| format!("Erreur manifest: {}", e))?
        .json()
        .await
        .map_err(|e| format!("Erreur JSON: {}", e))?;
    
    let versions = manifest["versions"].as_array()
        .ok_or("Versions non trouvées")?;
    
    let version_info = versions.iter()
        .find(|v| v["id"].as_str() == Some(version))
        .ok_or(format!("Version {} non trouvée", version))?;
    
    let version_url = version_info["url"].as_str()
        .ok_or("URL version non trouvée")?;
    
    let version_data: serde_json::Value = client
        .get(version_url)
        .send()
        .await
        .map_err(|e| format!("Erreur données version: {}", e))?
        .json()
        .await
        .map_err(|e| format!("Erreur JSON version: {}", e))?;
    
    let server_url = version_data["downloads"]["server"]["url"].as_str()
        .ok_or("URL serveur non trouvée")?;
    
    let jar_bytes = client
        .get(server_url)
        .send()
        .await
        .map_err(|e| format!("Erreur téléchargement: {}", e))?
        .bytes()
        .await
        .map_err(|e| format!("Erreur lecture bytes: {}", e))?;
    
    let jar_path = server_dir.join("server.jar");
    fs::write(&jar_path, &jar_bytes)
        .map_err(|e| format!("Erreur écriture JAR: {}", e))?;
    
    println!("JAR Vanilla téléchargé: {}", jar_path.display());
    Ok(())
}

// Télécharger un installeur Forge
async fn download_forge_installer(version: &str, server_dir: &std::path::PathBuf) -> Result<(), String> {
    use std::fs;
    
    // Format: 1.20.1-47.2.0
    let installer_url = format!(
        "https://maven.minecraftforge.net/net/minecraftforge/forge/{}/forge-{}-installer.jar",
        version, version
    );
    
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(300))
        .build()
        .map_err(|e| e.to_string())?;
    
    let jar_bytes = client
        .get(&installer_url)
        .send()
        .await
        .map_err(|e| format!("Erreur téléchargement Forge: {}", e))?
        .bytes()
        .await
        .map_err(|e| format!("Erreur lecture bytes: {}", e))?;
    
    let jar_path = server_dir.join("forge-installer.jar");
    fs::write(&jar_path, &jar_bytes)
        .map_err(|e| format!("Erreur écriture installeur: {}", e))?;
    
    println!("Installeur Forge téléchargé: {}", jar_path.display());
    Ok(())
}

// Télécharger un installeur NeoForge
async fn download_neoforge_installer(version: &str, server_dir: &std::path::PathBuf) -> Result<(), String> {
    use std::fs;
    
    let installer_url = format!(
        "https://maven.neoforged.net/releases/net/neoforged/neoforge/{}/neoforge-{}-installer.jar",
        version, version
    );
    
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(300))
        .build()
        .map_err(|e| e.to_string())?;
    
    let jar_bytes = client
        .get(&installer_url)
        .send()
        .await
        .map_err(|e| format!("Erreur téléchargement NeoForge: {}", e))?
        .bytes()
        .await
        .map_err(|e| format!("Erreur lecture bytes: {}", e))?;
    
    let jar_path = server_dir.join("neoforge-installer.jar");
    fs::write(&jar_path, &jar_bytes)
        .map_err(|e| format!("Erreur écriture installeur: {}", e))?;
    
    println!("Installeur NeoForge téléchargé: {}", jar_path.display());
    Ok(())
}

// Mettre à jour la version dans les fichiers de config
fn update_server_version_config(server_dir: &std::path::PathBuf, new_version: &str) -> Result<(), String> {
    use std::fs;
    
    let config_file = server_dir.join("nether-config.json");
    
    let mut config: serde_json::Value = if config_file.exists() {
        let content = fs::read_to_string(&config_file)
            .map_err(|e| format!("Erreur lecture config: {}", e))?;
        serde_json::from_str(&content).unwrap_or(serde_json::json!({}))
    } else {
        serde_json::json!({})
    };
    
    config["version"] = serde_json::json!(new_version);
    config["last_updated"] = serde_json::json!(chrono::Utc::now().to_rfc3339());
    
    let config_str = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Erreur sérialisation: {}", e))?;
    
    fs::write(&config_file, config_str)
        .map_err(|e| format!("Erreur écriture config: {}", e))?;
    
    Ok(())
}

// ========== INTÉGRATION PLAYIT.GG ==========

// Gestionnaire global pour le processus Playit.gg
lazy_static::lazy_static! {
    static ref PLAYIT_PROCESS: Arc<Mutex<Option<Child>>> = Arc::new(Mutex::new(None));
    static ref PLAYIT_TUNNEL_URL: Arc<Mutex<Option<String>>> = Arc::new(Mutex::new(None));
    static ref PLAYIT_LOGS: Arc<Mutex<Vec<String>>> = Arc::new(Mutex::new(Vec::new()));
    static ref LAST_DETECTION_TIME: Arc<Mutex<std::time::Instant>> = Arc::new(Mutex::new(std::time::Instant::now()));
}

// ========== SYSTÈME DE DÉTECTION D'IP TUNNEL ==========

use regex::Regex;
use serde_json::Value as JsonValue;

// Patterns de recherche pour détecter l'IP du tunnel (basés sur l'ancienne version)
fn get_tunnel_patterns() -> Vec<Regex> {
    vec![
        // Pattern 1: Messages spécifiques de Playit.gg
        Regex::new(r"([\w\-]+\.share\.playit\.gg)").unwrap(),
        Regex::new(r"([\w\-]+\.[\w\.]+joinmc\.link)").unwrap(),
        
        // Pattern 2: Messages contextuels avec mots-clés
        Regex::new(r"(?:(?:tunnel|link|connect|url|address|server)\s*(?:is|at|:)?\s*)([\w\-]+\.(?:share\.playit\.gg|[\w\.]+joinmc\.link))").unwrap(),
        
        // Pattern 3: Messages spécifiques de création de tunnel
        Regex::new(r"(?:Tunnel created|Connected as|Tunnel ready|is now available).*?([\w\-]+\.(?:share\.playit\.gg|[\w\.]+joinmc\.link))").unwrap(),
        
        // Pattern 4: Format générique pour tous les types d'URL
        Regex::new(r"([\w\-]+\.(?:share\.playit\.gg|[\w\.]+joinmc\.link))").unwrap(),
    ]
}

// Rechercher l'IP du tunnel dans les logs
fn search_tunnel_url_in_logs(logs: &[String]) -> Option<String> {
    let patterns = get_tunnel_patterns();
    
    for log_line in logs {
        for pattern in &patterns {
            if let Some(captures) = pattern.captures(log_line) {
                if let Some(matched_url) = captures.get(1) {
                    let url = matched_url.as_str().to_string();
                    println!("🎯 IP tunnel détectée dans les logs: {}", url);
                    return Some(url);
                }
            }
        }
    }
    
    None
}

// Rechercher l'IP du tunnel dans les fichiers de configuration
fn search_tunnel_url_in_config_files() -> Option<String> {
    use std::env;
    use std::path::PathBuf;
    
    let app_data = match env::var("APPDATA") {
        Ok(path) => path,
        Err(_) => return None,
    };
    
    let playit_dir = PathBuf::from(&app_data)
        .join("NetherClient")
        .join("playit");
    
    let config_files = vec![
        playit_dir.join("playit.toml"),
        playit_dir.join("agent-config.json"),
        playit_dir.join("agent.json"),
        playit_dir.join("config.toml"),
        playit_dir.join("config.json"),
    ];
    
    for config_file in config_files {
        if config_file.exists() {
            println!("🔍 Recherche dans le fichier: {}", config_file.display());
            
            // Lecture du fichier TOML
            if config_file.extension().and_then(|s| s.to_str()) == Some("toml") {
                if let Ok(content) = std::fs::read_to_string(&config_file) {
                    if let Some(url) = search_tunnel_url_in_toml(&content) {
                        println!("🎯 IP tunnel détectée dans TOML: {}", url);
                        return Some(url);
                    }
                }
            }
            
            // Lecture du fichier JSON
            if config_file.extension().and_then(|s| s.to_str()) == Some("json") {
                if let Ok(content) = std::fs::read_to_string(&config_file) {
                    if let Some(url) = search_tunnel_url_in_json(&content) {
                        println!("🎯 IP tunnel détectée dans JSON: {}", url);
                        return Some(url);
                    }
                }
            }
        }
    }
    
    None
}

// Rechercher l'IP du tunnel dans le contenu TOML
fn search_tunnel_url_in_toml(content: &str) -> Option<String> {
    let patterns = get_tunnel_patterns();
    
    for pattern in &patterns {
        if let Some(captures) = pattern.captures(content) {
            if let Some(matched_url) = captures.get(1) {
                return Some(matched_url.as_str().to_string());
            }
        }
    }
    
    None
}

// Rechercher l'IP du tunnel dans le contenu JSON
fn search_tunnel_url_in_json(content: &str) -> Option<String> {
    let patterns = get_tunnel_patterns();
    
    // Recherche directe dans le texte JSON
    for pattern in &patterns {
        if let Some(captures) = pattern.captures(content) {
            if let Some(matched_url) = captures.get(1) {
                return Some(matched_url.as_str().to_string());
            }
        }
    }
    
    // Recherche dans la structure JSON
    if let Ok(json_value) = serde_json::from_str::<JsonValue>(content) {
        return search_recursive_in_json(&json_value);
    }
    
    None
}

// Recherche récursive dans la structure JSON
fn search_recursive_in_json(data: &JsonValue) -> Option<String> {
    match data {
        JsonValue::String(s) => {
            let patterns = get_tunnel_patterns();
            for pattern in &patterns {
                if let Some(captures) = pattern.captures(s) {
                    if let Some(matched_url) = captures.get(1) {
                        return Some(matched_url.as_str().to_string());
                    }
                }
            }
            None
        }
        JsonValue::Object(map) => {
            for (_, value) in map {
                if let Some(result) = search_recursive_in_json(value) {
                    return Some(result);
                }
            }
            None
        }
        JsonValue::Array(arr) => {
            for item in arr {
                if let Some(result) = search_recursive_in_json(item) {
                    return Some(result);
                }
            }
            None
        }
        _ => None,
    }
}

// Rechercher l'IP du tunnel dans les fichiers récemment modifiés
fn search_tunnel_url_in_recent_files() -> Option<String> {
    use std::env;
    use std::path::PathBuf;
    use std::time::{SystemTime, UNIX_EPOCH};
    
    let app_data = match env::var("APPDATA") {
        Ok(path) => path,
        Err(_) => return None,
    };
    
    let playit_dir = PathBuf::from(&app_data)
        .join("NetherClient")
        .join("playit");
    
    if !playit_dir.exists() {
        return None;
    }
    
    let current_time = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();
    
    // Rechercher les fichiers modifiés dans les 2 dernières minutes
    let cutoff_time = current_time - 120;
    
    if let Ok(entries) = std::fs::read_dir(&playit_dir) {
        for entry in entries.flatten() {
            if let Ok(metadata) = entry.metadata() {
                if let Ok(modified_time) = metadata.modified() {
                    if let Ok(modified_secs) = modified_time.duration_since(UNIX_EPOCH) {
                        if modified_secs.as_secs() > cutoff_time {
                            let path = entry.path();
                            
                            // Ignorer les fichiers trop volumineux (> 50 KB)
                            if metadata.len() > 50_000 {
                                continue;
                            }
                            
                            // Lire le fichier et chercher l'IP
                            if let Ok(content) = std::fs::read_to_string(&path) {
                                let patterns = get_tunnel_patterns();
                                for pattern in &patterns {
                                    if let Some(captures) = pattern.captures(&content) {
                                        if let Some(matched_url) = captures.get(1) {
                                            println!("🎯 IP tunnel détectée dans fichier récent: {} -> {}", path.display(), matched_url.as_str());
                                            return Some(matched_url.as_str().to_string());
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    None
}

// Fonction principale de détection d'IP tunnel (basée sur l'ancienne version)
fn detect_tunnel_url() -> Option<String> {
    // Vérifier si on a déjà une URL en cache
    {
        let tunnel_url = PLAYIT_TUNNEL_URL.lock().unwrap();
        if tunnel_url.is_some() {
            return tunnel_url.clone();
        }
    }
    
    println!("🔍 Début de la détection automatique de l'IP tunnel...");
    
    // 1. Rechercher dans les logs en mémoire (priorité haute)
    {
        let logs = PLAYIT_LOGS.lock().unwrap();
        if let Some(url) = search_tunnel_url_in_logs(&logs) {
            println!("🎯 IP tunnel trouvée dans les logs: {}", url);
            return Some(url);
        }
    }
    
    // 2. Rechercher dans les fichiers de configuration (priorité moyenne)
    if let Some(url) = search_tunnel_url_in_config_files() {
        println!("🎯 IP tunnel trouvée dans les fichiers de config: {}", url);
        return Some(url);
    }
    
    // 3. Rechercher dans les fichiers récemment modifiés (priorité basse)
    if let Some(url) = search_tunnel_url_in_recent_files() {
        println!("🎯 IP tunnel trouvée dans les fichiers récents: {}", url);
        return Some(url);
    }
    
    println!("❌ Aucune IP tunnel détectée automatiquement");
    None
}

// Lancer Playit.gg et capturer le lien tunnel
#[tauri::command]
async fn start_playit(port: u16) -> Result<String, String> {
    use std::env;
    use std::path::PathBuf;
    
    println!("Démarrage de Playit.gg pour le port {}...", port);
    
    // Vérifier si Playit.gg est déjà en cours d'exécution
    {
        let mut process = PLAYIT_PROCESS.lock().unwrap();
        if let Some(ref mut child) = *process {
            if let Ok(None) = child.try_wait() {
                return Err("Playit.gg est déjà en cours d'exécution".to_string());
            }
        }
    }
    
    // Chemin vers playit.exe (même dossier que l'installation)
    let app_data = env::var("APPDATA").map_err(|e| e.to_string())?;
    let playit_path = PathBuf::from(&app_data)
        .join("NetherClient")
        .join("playit")
        .join("playit.exe");
    
    if !playit_path.exists() {
        return Err("Playit.gg n'est pas installé. Veuillez l'installer d'abord.".to_string());
    }
    
    // Lancer playit.exe avec capture stdout/stderr pour surveillance des logs
    let mut child = Command::new(&playit_path)
        .current_dir(playit_path.parent().unwrap())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Erreur lancement Playit.gg: {}", e))?;
    
    println!("Playit.gg lancé avec PID: {}", child.id());
    
    // Démarrer la surveillance des logs en arrière-plan
    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();
    
    // Thread pour surveiller stdout
    let stdout_clone = Arc::clone(&PLAYIT_LOGS);
    let tunnel_url_clone = Arc::clone(&PLAYIT_TUNNEL_URL);
    std::thread::spawn(move || {
        use std::io::{BufRead, BufReader};
        let reader = BufReader::new(stdout);
        
        for line in reader.lines() {
            if let Ok(line) = line {
                println!("Playit stdout: {}", line);
                
                // Ajouter à la liste des logs
                {
                    let mut logs = stdout_clone.lock().unwrap();
                    logs.push(line.clone());
                    if logs.len() > 100 {
                        logs.remove(0);
                    }
                }
                
                // Vérifier si cette ligne contient une adresse tunnel
                if let Some(url) = search_tunnel_url_in_logs(&[line]) {
                    println!("🎯 IP tunnel détectée dans les logs: {}", url);
                    
                    // Mettre à jour l'URL stockée
                    {
                        let mut tunnel_url = tunnel_url_clone.lock().unwrap();
                        *tunnel_url = Some(url);
                    }
                }
            }
        }
    });
    
    // Thread pour surveiller stderr
    let stderr_clone = Arc::clone(&PLAYIT_LOGS);
    let tunnel_url_clone2 = Arc::clone(&PLAYIT_TUNNEL_URL);
    std::thread::spawn(move || {
        use std::io::{BufRead, BufReader};
        let reader = BufReader::new(stderr);
        
        for line in reader.lines() {
            if let Ok(line) = line {
                println!("Playit stderr: {}", line);
                
                // Ajouter à la liste des logs
                {
                    let mut logs = stderr_clone.lock().unwrap();
                    logs.push(line.clone());
                    if logs.len() > 100 {
                        logs.remove(0);
                    }
                }
                
                // Vérifier si cette ligne contient une adresse tunnel
                if let Some(url) = search_tunnel_url_in_logs(&[line]) {
                    println!("🎯 IP tunnel détectée dans les logs stderr: {}", url);
                    
                    // Mettre à jour l'URL stockée
                    {
                        let mut tunnel_url = tunnel_url_clone2.lock().unwrap();
                        *tunnel_url = Some(url);
                    }
                }
            }
        }
    });
    
    // Stocker le processus
    {
        let mut process = PLAYIT_PROCESS.lock().unwrap();
        *process = Some(child);
    }
    
    // Message d'instructions pour l'utilisateur
    Ok(format!(
        "✅ Playit.gg lancé !\n\n\
        📋 INSTRUCTIONS :\n\
        1. Playit.gg s'est lancé en arrière-plan\n\
        2. Surveillez les logs pour voir la configuration\n\
        3. Connectez-vous avec votre compte Playit.gg (ou créez-en un)\n\
        4. Configurez le tunnel pour le port {} (TCP)\n\
        5. L'IP du tunnel sera détectée automatiquement dans les logs\n\n\
        💡 Astuce : L'IP apparaîtra automatiquement quand le tunnel sera configuré !",
        port
    ))
}

// Arrêter Playit.gg
#[tauri::command]
async fn stop_playit() -> Result<(), String> {
    println!("Arrêt de Playit.gg...");
    
    // Tuer tous les processus playit.exe
    #[cfg(target_os = "windows")]
    {
        let _ = Command::new("taskkill")
            .args(["/F", "/IM", "playit.exe"])
            .output();
    }
    
    // Nettoyer le processus stocké
    {
        let mut process = PLAYIT_PROCESS.lock().unwrap();
        *process = None;
    }
    
    // Réinitialiser l'URL du tunnel
    {
        let mut tunnel_url = PLAYIT_TUNNEL_URL.lock().unwrap();
        *tunnel_url = None;
    }
    
    println!("Playit.gg arrêté");
    Ok(())
}

// Obtenir le lien tunnel actuel
#[tauri::command]
async fn get_playit_tunnel_url() -> Result<Option<String>, String> {
    let tunnel_url = PLAYIT_TUNNEL_URL.lock().unwrap();
    Ok(tunnel_url.clone())
}

// Commande pour définir manuellement l'URL du tunnel
#[tauri::command]
async fn set_playit_tunnel_url(url: String) -> Result<(), String> {
    let mut tunnel_url = PLAYIT_TUNNEL_URL.lock().unwrap();
    *tunnel_url = Some(url);
    Ok(())
}

// Commande pour forcer la détection de l'IP tunnel
#[tauri::command]
async fn detect_playit_tunnel_url() -> Result<Option<String>, String> {
    println!("🔍 Lancement de la détection forcée de l'IP tunnel...");
    
    if let Some(detected_url) = detect_tunnel_url() {
        // Mettre à jour l'URL stockée
        {
            let mut tunnel_url = PLAYIT_TUNNEL_URL.lock().unwrap();
            *tunnel_url = Some(detected_url.clone());
        }
        
        println!("✅ IP tunnel détectée et sauvegardée: {}", detected_url);
        Ok(Some(detected_url))
    } else {
        println!("❌ Aucune IP tunnel détectée");
        Ok(None)
    }
}

// Vérifier si Playit.gg est en cours d'exécution
#[tauri::command]
async fn is_playit_running() -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        let output = Command::new("tasklist")
            .args(["/FI", "IMAGENAME eq playit.exe"])
            .output()
            .map_err(|e| e.to_string())?;
        
        let output_str = String::from_utf8_lossy(&output.stdout);
        Ok(output_str.contains("playit.exe"))
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        Ok(false)
    }
}

// Forcer la fermeture complète de l'application (comme terminer la tâche)
#[tauri::command]
async fn force_quit() -> Result<(), String> {
    println!("Fermeture forcée de l'application...");
    std::process::exit(0);
}

// ========== INSTALLATION DE MODPACKS ==========

#[derive(Debug, Serialize, Deserialize)]
#[allow(dead_code)] // Struct réservée pour future implémentation de barre de progression
struct ModpackInstallProgress {
    status: String,
    progress: f32,
    message: String,
}

// Télécharger et installer un modpack
#[tauri::command]
async fn install_modpack(
    server_name: String,
    modpack_name: String,
    download_url: String,
) -> Result<String, String> {
    use std::env;
    use std::path::PathBuf;
    use std::fs;
    
    println!("Installation du modpack {} pour le serveur {}", modpack_name, server_name);
    
    // Créer le dossier du serveur s'il n'existe pas
    let app_data = env::var("APPDATA").map_err(|e| e.to_string())?;
    let server_path = PathBuf::from(&app_data)
        .join("NetherClient")
        .join("Serveurs")
        .join(&server_name);
    
    fs::create_dir_all(&server_path)
        .map_err(|e| format!("Erreur création dossier serveur: {}", e))?;
    
    println!("Dossier serveur créé: {}", server_path.display());
    
    // Télécharger le modpack
    if !download_url.is_empty() {
        println!("Téléchargement du modpack depuis: {}", download_url);
        
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(600)) // 10 minutes
            .build()
            .map_err(|e| e.to_string())?;
        
        let response = client
            .get(&download_url)
            .send()
            .await
            .map_err(|e| format!("Erreur téléchargement: {}", e))?;
        
        let modpack_bytes = response
            .bytes()
            .await
            .map_err(|e| format!("Erreur lecture bytes: {}", e))?;
        
        println!("Modpack téléchargé: {} octets", modpack_bytes.len());
        
        // Sauvegarder le fichier
        let modpack_file = server_path.join("modpack.zip");
        fs::write(&modpack_file, &modpack_bytes)
            .map_err(|e| format!("Erreur sauvegarde modpack: {}", e))?;
        
        println!("Modpack sauvegardé: {}", modpack_file.display());
        
        // Extraire le modpack
        println!("Extraction du modpack...");
        extract_modpack(&modpack_file, &server_path)?;
        
        // Supprimer le fichier zip
        fs::remove_file(&modpack_file)
            .map_err(|e| format!("Erreur suppression zip: {}", e))?;
        
        println!("Modpack installé avec succès!");
    } else {
        // Créer un serveur vide pour ce modpack
        println!("Création d'un serveur vide pour le modpack");
    }
    
    // Créer les fichiers de configuration de base
    create_modpack_config(&server_path, &modpack_name)?;
    
    Ok(format!("Modpack {} installé avec succès dans {}", modpack_name, server_name))
}

// Extraire un modpack ZIP
fn extract_modpack(zip_path: &std::path::PathBuf, output_path: &std::path::PathBuf) -> Result<(), String> {
    use std::fs;
    use zip::ZipArchive;
    
    let file = fs::File::open(zip_path)
        .map_err(|e| format!("Erreur ouverture ZIP: {}", e))?;
    
    let mut archive = ZipArchive::new(file)
        .map_err(|e| format!("Erreur lecture ZIP: {}", e))?;
    
    for i in 0..archive.len() {
        let mut file = archive.by_index(i)
            .map_err(|e| format!("Erreur extraction fichier: {}", e))?;
        
        let file_path = file.name().to_string();
        let outpath = output_path.join(&file_path);
        
        if file.is_dir() {
            fs::create_dir_all(&outpath)
                .map_err(|e| format!("Erreur création dossier: {}", e))?;
        } else {
            if let Some(parent) = outpath.parent() {
                fs::create_dir_all(parent)
                    .map_err(|e| format!("Erreur création parent: {}", e))?;
            }
            
            let mut outfile = fs::File::create(&outpath)
                .map_err(|e| format!("Erreur création fichier: {}", e))?;
            
            std::io::copy(&mut file, &mut outfile)
                .map_err(|e| format!("Erreur copie fichier: {}", e))?;
        }
    }
    
    Ok(())
}

// Créer les fichiers de configuration pour le modpack
fn create_modpack_config(server_path: &std::path::PathBuf, modpack_name: &str) -> Result<(), String> {
    use std::fs;
    use std::io::Write;
    
    // Créer eula.txt
    let eula_path = server_path.join("eula.txt");
    if !eula_path.exists() {
        let mut eula_file = fs::File::create(&eula_path)
            .map_err(|e| format!("Erreur création EULA: {}", e))?;
        eula_file.write_all(b"eula=true\n")
            .map_err(|e| format!("Erreur écriture EULA: {}", e))?;
    }
    
    // Créer un fichier de configuration Nether Client
    let config = serde_json::json!({
        "modpack": modpack_name,
        "installed_at": chrono::Utc::now().to_rfc3339(),
        "version": "1.0.0"
    });
    
    let config_path = server_path.join("nether-modpack.json");
    let config_str = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Erreur sérialisation config: {}", e))?;
    
    fs::write(&config_path, config_str)
        .map_err(|e| format!("Erreur écriture config: {}", e))?;
    
    println!("Configuration du modpack créée");
    
    Ok(())
}

// Obtenir la liste des modpacks installés
#[tauri::command]
async fn list_installed_modpacks() -> Result<Vec<serde_json::Value>, String> {
    use std::env;
    use std::path::PathBuf;
    use std::fs;
    
    let app_data = env::var("APPDATA").map_err(|e| e.to_string())?;
    let servers_path = PathBuf::from(&app_data)
        .join("NetherClient")
        .join("Serveurs");
    
    if !servers_path.exists() {
        return Ok(Vec::new());
    }
    
    let mut modpacks = Vec::new();
    
    for entry in fs::read_dir(&servers_path)
        .map_err(|e| format!("Erreur lecture dossier serveurs: {}", e))? 
    {
        let entry = entry.map_err(|e| format!("Erreur entrée: {}", e))?;
        let path = entry.path();
        
        if path.is_dir() {
            let config_file = path.join("nether-modpack.json");
            if config_file.exists() {
                let config_content = fs::read_to_string(&config_file)
                    .map_err(|e| format!("Erreur lecture config: {}", e))?;
                
                let config: serde_json::Value = serde_json::from_str(&config_content)
                    .unwrap_or(serde_json::json!({}));
                
                modpacks.push(serde_json::json!({
                    "server_name": entry.file_name().to_string_lossy(),
                    "modpack": config["modpack"],
                    "installed_at": config["installed_at"],
                    "version": config["version"]
                }));
            }
        }
    }
    
    Ok(modpacks)
}

// Désinstaller un modpack
#[tauri::command]
async fn uninstall_modpack(server_name: String) -> Result<(), String> {
    use std::env;
    use std::path::PathBuf;
    use std::fs;
    
    let app_data = env::var("APPDATA").map_err(|e| e.to_string())?;
    let server_path = PathBuf::from(&app_data)
        .join("NetherClient")
        .join("Serveurs")
        .join(&server_name);
    
    if server_path.exists() {
        fs::remove_dir_all(&server_path)
            .map_err(|e| format!("Erreur suppression serveur: {}", e))?;
        println!("Modpack {} désinstallé", server_name);
    }
    
    Ok(())
}

// Fonction interne pour détecter la version d'un serveur (utilisée par scan_servers_directory et detect_server_version)
fn detect_version_internal(path: &std::path::PathBuf) -> String {
    use std::fs;
    use std::io::{BufRead, BufReader};
    
    let mut version = String::new();
    
    // ========== MÉTHODE 1: Détection depuis le nom du JAR ==========
    let jar_files: Vec<_> = fs::read_dir(path)
        .ok()
        .and_then(|entries| {
            Some(entries.filter_map(|e| e.ok())
                .filter(|e| {
                    let name = e.file_name().to_string_lossy().to_lowercase();
                    name.ends_with(".jar")
                })
                .collect())
        })
        .unwrap_or_default();
    
    for jar_file in &jar_files {
        let jar_name = jar_file.file_name().to_string_lossy().to_string();
        let jar_name_lower = jar_name.to_lowercase();
        
        // Vanilla: server-1.20.1.jar, minecraft_server.1.20.1.jar
        if jar_name_lower.contains("server-") || jar_name_lower.contains("minecraft_server") {
            if jar_name_lower.contains("server-") {
                let parts: Vec<&str> = jar_name.split("server-").collect();
                if parts.len() > 1 {
                    let version_part = parts[1].replace(".jar", "");
                    if version_part.matches('.').count() >= 1 && version_part.chars().any(|c| c.is_ascii_digit()) {
                        version = version_part;
                        break;
                    }
                }
            } else if jar_name_lower.contains("minecraft_server") {
                let parts: Vec<&str> = jar_name.split("minecraft_server.").collect();
                if parts.len() > 1 {
                    let version_part = parts[1].replace(".jar", "");
                    if version_part.matches('.').count() >= 1 && version_part.chars().any(|c| c.is_ascii_digit()) {
                        version = version_part;
                        break;
                    }
                }
            }
        }
        // Paper: paper-1.20.1-123.jar, paper.jar
        else if jar_name_lower.contains("paper-") || jar_name_lower == "paper.jar" {
            if jar_name_lower.contains("paper-") {
                let parts: Vec<&str> = jar_name.split("paper-").collect();
                if parts.len() > 1 {
                    let version_part = parts[1].replace(".jar", "");
                    if let Some(dash_pos) = version_part.rfind('-') {
                        let potential_version = &version_part[..dash_pos];
                        if potential_version.matches('.').count() >= 1 {
                            version = potential_version.to_string();
                            break;
                        }
                    } else if version_part.matches('.').count() >= 1 {
                        version = version_part;
                        break;
                    }
                }
            }
        }
        // Spigot: spigot-1.20.1.jar, spigot.jar
        else if jar_name_lower.contains("spigot-") || jar_name_lower == "spigot.jar" {
            if jar_name_lower.contains("spigot-") {
                let parts: Vec<&str> = jar_name.split("spigot-").collect();
                if parts.len() > 1 {
                    let version_part = parts[1].replace(".jar", "");
                    if version_part.matches('.').count() >= 1 {
                        version = version_part;
                        break;
                    }
                }
            }
        }
        // Forge: forge-1.20.1-47.1.0.jar, forge-1.20.1-47.1.0-universal.jar, ou forge-17.0.13.jar
        else if jar_name_lower.contains("forge-") {
            let parts: Vec<&str> = jar_name.split("forge-").collect();
            if parts.len() > 1 {
                let version_part = parts[1].replace(".jar", "").replace("-universal", "");
                if version_part.starts_with("1.") || version_part.starts_with("0.") {
                    if let Some(dash_pos) = version_part.find('-') {
                        let potential_version = &version_part[..dash_pos];
                        if potential_version.matches('.').count() >= 1 {
                            version = potential_version.to_string();
                            break;
                        }
                    } else if version_part.matches('.').count() >= 1 {
                        version = version_part;
                        break;
                    }
                }
            }
        }
        // NeoForge: neoforge-1.20.1-47.1.0.jar
        else if jar_name_lower.contains("neoforge-") {
            let parts: Vec<&str> = jar_name.split("neoforge-").collect();
            if parts.len() > 1 {
                let version_part = parts[1].replace(".jar", "").replace("-universal", "");
                if let Some(dash_pos) = version_part.find('-') {
                    let potential_version = &version_part[..dash_pos];
                    if potential_version.matches('.').count() >= 1 {
                        version = potential_version.to_string();
                        break;
                    }
                } else if version_part.matches('.').count() >= 1 {
                    version = version_part;
                    break;
                }
            }
        }
        // Mohist: mohist-1.20.1-xxx.jar
        else if jar_name_lower.contains("mohist-") {
            let parts: Vec<&str> = jar_name.split("mohist-").collect();
            if parts.len() > 1 {
                let version_part = parts[1].replace(".jar", "");
                if let Some(dash_pos) = version_part.find('-') {
                    let potential_version = &version_part[..dash_pos];
                    if potential_version.matches('.').count() >= 1 {
                        version = potential_version.to_string();
                        break;
                    }
                } else if version_part.matches('.').count() >= 1 {
                    version = version_part;
                    break;
                }
            }
        }
    }
    
    // ========== MÉTHODE 2: Détection depuis version.json ==========
    if version.is_empty() {
        let version_file = path.join("version.json");
        if version_file.exists() {
            if let Ok(content) = fs::read_to_string(&version_file) {
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                    if let Some(v) = json["id"].as_str() {
                        if v.starts_with("1.") || v.starts_with("0.") {
                            version = v.to_string();
                        }
                    } else if let Some(v) = json["version"].as_str() {
                        if v.starts_with("1.") || v.starts_with("0.") {
                            version = v.to_string();
                        }
                    }
                }
            }
        }
    }
    
    // ========== MÉTHODE 3: Détection depuis les logs ==========
    if version.is_empty() {
        let logs_path = path.join("logs");
        let latest_log = logs_path.join("latest.log");
        
        if latest_log.exists() {
            if let Ok(file) = fs::File::open(&latest_log) {
                let reader = BufReader::new(file);
                for (index, line) in reader.lines().enumerate() {
                    if index > 100 { break; }
                    
                    if let Ok(line) = line {
                        let line_lower = line.to_lowercase();
                        
                        // Pattern 1: "MC: 1.20.1"
                        if line_lower.contains("mc:") {
                            if let Some(mc_pos) = line_lower.find("mc:") {
                                let after_mc = &line[mc_pos + 3..];
                                let words: Vec<&str> = after_mc.split_whitespace().collect();
                                if let Some(first_word) = words.first() {
                                    let potential_version = first_word.trim_matches(|c: char| !c.is_alphanumeric() && c != '.');
                                    if potential_version.matches('.').count() >= 1 && potential_version.starts_with("1.") {
                                        version = potential_version.to_string();
                                        break;
                                    }
                                }
                            }
                        }
                        
                        // Pattern 2: "Starting minecraft server version X.Y.Z"
                        if version.is_empty() && line_lower.contains("starting") && line_lower.contains("version") {
                            let words: Vec<&str> = line.split_whitespace().collect();
                            for (i, word) in words.iter().enumerate() {
                                if word.to_lowercase() == "version" && i + 1 < words.len() {
                                    let potential_version = words[i + 1].trim_matches(|c: char| !c.is_alphanumeric() && c != '.');
                                    if potential_version.matches('.').count() >= 1 && potential_version.starts_with("1.") {
                                        version = potential_version.to_string();
                                        break;
                                    }
                                }
                            }
                            if !version.is_empty() { break; }
                        }
                        
                        // Pattern 3: "Minecraft X.Y.Z"
                        if version.is_empty() && line_lower.contains("minecraft") && !line_lower.contains("server") {
                            let words: Vec<&str> = line.split_whitespace().collect();
                            for (i, word) in words.iter().enumerate() {
                                if word.to_lowercase() == "minecraft" && i + 1 < words.len() {
                                    let next_word = words[i + 1];
                                    let potential_version = next_word.trim_matches(|c: char| !c.is_alphanumeric() && c != '.');
                                    if potential_version.matches('.').count() >= 1 && potential_version.starts_with("1.") {
                                        version = potential_version.to_string();
                                        break;
                                    }
                                }
                            }
                            if !version.is_empty() { break; }
                        }
                    }
                }
            }
        }
    }
    
    // ========== MÉTHODE 4: Détection depuis server.properties ==========
    if version.is_empty() {
        let properties_file = path.join("server.properties");
        if properties_file.exists() {
            if let Ok(content) = fs::read_to_string(&properties_file) {
                for line in content.lines() {
                    let line_lower = line.to_lowercase();
                    if line_lower.contains("version") || line_lower.contains("minecraft") {
                        let words: Vec<&str> = line.split_whitespace().collect();
                        for word in words {
                            if word.matches('.').count() >= 1 {
                                let cleaned = word.trim_matches(|c: char| !c.is_alphanumeric() && c != '.');
                                if cleaned.matches('.').count() >= 1 && cleaned.starts_with("1.") {
                                    version = cleaned.to_string();
                                    break;
                                }
                            }
                        }
                        if !version.is_empty() { break; }
                    }
                }
            }
        }
    }
    
    // ========== MÉTHODE 5: Détection générique depuis n'importe quel JAR ==========
    if version.is_empty() && !jar_files.is_empty() {
        for jar_file in &jar_files {
            let jar_name = jar_file.file_name().to_string_lossy().to_string();
            let chars: Vec<char> = jar_name.chars().collect();
            let mut i = 0;
            let mut current_version = String::new();
            let mut in_version = false;
            let mut digit_count = 0;
            
            while i < chars.len() {
                let ch = chars[i];
                if ch.is_ascii_digit() {
                    if !in_version {
                        in_version = true;
                        current_version.clear();
                        digit_count = 0;
                    }
                    current_version.push(ch);
                    digit_count += 1;
                } else if ch == '.' && in_version {
                    current_version.push(ch);
                } else if in_version {
                    if current_version.matches('.').count() >= 1 && digit_count >= 2 {
                        if current_version.starts_with("1.") || current_version.starts_with("0.") {
                            version = current_version.trim_end_matches('.').to_string();
                            break;
                        }
                    }
                    in_version = false;
                    current_version.clear();
                    digit_count = 0;
                }
                i += 1;
            }
            
            if in_version && current_version.matches('.').count() >= 1 && digit_count >= 2 {
                if current_version.starts_with("1.") || current_version.starts_with("0.") {
                    version = current_version.trim_end_matches('.').to_string();
                    break;
                }
            }
            
            if !version.is_empty() {
                break;
            }
        }
    }
    
    // Nettoyer la version
    if !version.is_empty() {
        version = version.trim().to_string();
        version = version.chars()
            .filter(|c| c.is_ascii_digit() || *c == '.')
            .collect::<String>();
        
        let parts: Vec<&str> = version.split('.').collect();
        if parts.len() < 2 || parts.iter().any(|p| p.is_empty()) {
            version.clear();
        }
    }
    
    version
}

// Scanner le dossier des serveurs pour détecter les serveurs importés manuellement
#[tauri::command]
async fn scan_servers_directory() -> Result<Vec<serde_json::Value>, String> {
    use std::env;
    use std::path::PathBuf;
    use std::fs;
    
    let app_data = env::var("APPDATA").map_err(|e| e.to_string())?;
    let servers_path = PathBuf::from(&app_data)
        .join("NetherClient")
        .join("Serveurs");
    
    if !servers_path.exists() {
        return Ok(Vec::new());
    }
    
    let mut detected_servers = Vec::new();
    
    for entry in fs::read_dir(&servers_path)
        .map_err(|e| format!("Erreur lecture dossier serveurs: {}", e))? 
    {
        let entry = entry.map_err(|e| format!("Erreur entrée: {}", e))?;
        let path = entry.path();
        
        if path.is_dir() {
            let server_name = entry.file_name().to_string_lossy().to_string();
            let properties_file = path.join("server.properties");
            
            // Vérifier si c'est un serveur valide (a un server.properties)
            if properties_file.exists() {
                // Lire les propriétés de base
                let mut port = 25565;
                let mut server_type = "vanilla".to_string();
                
                if let Ok(content) = fs::read_to_string(&properties_file) {
                    for line in content.lines() {
                        if line.starts_with("server-port=") {
                            if let Some(port_str) = line.split('=').nth(1) {
                                if let Ok(p) = port_str.trim().parse::<u16>() {
                                    port = p;
                                }
                            }
                        }
                    }
                }
                
                // Détecter le type de serveur
                // Vérifier d'abord Paper/Spigot (détection par fichiers de configuration)
                if path.join("paper.jar").exists() || path.join("spigot.jar").exists() || 
                   path.join("bukkit.yml").exists() || path.join("spigot.yml").exists() ||
                   (path.join("plugins").exists() && !path.join("mods").exists()) {
                    server_type = "paper".to_string();
                }
                // Vérifier ensuite les mods
                else if path.join("mods").exists() {
                    let mut found_neoforge = false;
                    let mut found_forge = false;
                    let mut found_mohist = false;
                    
                    if let Ok(entries) = fs::read_dir(path.join("mods")) {
                        for entry in entries.filter_map(|e| e.ok()) {
                            let name = entry.file_name().to_string_lossy().to_lowercase();
                            if name.contains("neoforge") {
                                found_neoforge = true;
                                break;
                            } else if name.contains("mohist") {
                                found_mohist = true;
                                break;
                            } else if name.contains("forge") {
                                found_forge = true;
                            }
                        }
                    }
                    
                    if found_neoforge {
                        server_type = "neoforge".to_string();
                    } else if found_mohist {
                        server_type = "mohist".to_string();
                    } else if found_forge {
                        server_type = "forge".to_string();
                    } else {
                        server_type = "forge".to_string(); // Par défaut si mods présents
                    }
                }
                
                // Utiliser la fonction robuste de détection pour tous les serveurs
                let detected_version = detect_version_internal(&path);
                let final_version = if detected_version.is_empty() { "Unknown".to_string() } else { detected_version };
                
                detected_servers.push(serde_json::json!({
                    "name": server_name,
                    "path": path.to_string_lossy().to_string(),
                    "port": port,
                    "version": final_version,
                    "type": server_type
                }));
            }
        }
    }
    
    Ok(detected_servers)
}

// Commande pour détecter la version d'un serveur existant (version robuste)
#[tauri::command]
async fn detect_server_version(server_path: String) -> Result<String, String> {
    use std::path::PathBuf;
    
    let path = PathBuf::from(&server_path);
    
    if !path.exists() {
        return Err("Le chemin du serveur n'existe pas".to_string());
    }
    
    let version = detect_version_internal(&path);
    
    if version.is_empty() {
        println!("⚠️ Version non détectée pour: {}", server_path);
        return Ok("Unknown".to_string());
    }
    
    println!("✅ Version détectée: {} pour {}", version, server_path);
    Ok(version)
}

// ========== GESTION DES JOUEURS (MODERATION) ==========

#[derive(Debug, Serialize, Deserialize)]
struct Player {
    username: String,
    uuid: String,
    is_online: bool,
    is_op: bool,
    is_banned: bool,
    is_whitelisted: bool,
}

// Obtenir la liste des joueurs
#[tauri::command]
async fn get_server_players(server_path: String) -> Result<Vec<Player>, String> {
    use std::path::PathBuf;
    use std::fs;
    use std::io::Read;

    let path = PathBuf::from(&server_path);
    
    // Lire les joueurs bannis (banned-players.json)
    let banned_file = path.join("banned-players.json");
    let banned: Vec<serde_json::Value> = if banned_file.exists() {
        let mut content = String::new();
        fs::File::open(&banned_file)
            .and_then(|mut f| f.read_to_string(&mut content))
            .ok();
        serde_json::from_str(&content).unwrap_or_else(|_| Vec::new())
    } else {
        Vec::new()
    };
    
    // Lire les OPs (ops.json)
    let ops_file = path.join("ops.json");
    let ops: Vec<serde_json::Value> = if ops_file.exists() {
        let mut content = String::new();
        fs::File::open(&ops_file)
            .and_then(|mut f| f.read_to_string(&mut content))
            .ok();
        serde_json::from_str(&content).unwrap_or_else(|_| Vec::new())
    } else {
        Vec::new()
    };
    
    // Lire la whitelist (whitelist.json)
    let whitelist_file = path.join("whitelist.json");
    let whitelist: Vec<serde_json::Value> = if whitelist_file.exists() {
        let mut content = String::new();
        fs::File::open(&whitelist_file)
            .and_then(|mut f| f.read_to_string(&mut content))
            .ok();
        serde_json::from_str(&content).unwrap_or_else(|_| Vec::new())
    } else {
        Vec::new()
    };
    
    // Combiner toutes les données
    let mut player_map: HashMap<String, Player> = HashMap::new();
    
    // Ajouter les joueurs bannis (PRIORITAIRE - doit être fait en premier)
    for entry in &banned {
        if let Some(name) = entry["name"].as_str() {
            // Le UUID peut être optionnel dans certains cas, utiliser le nom comme clé de secours
            let uuid = entry["uuid"].as_str()
                .map(|u| u.to_string())
                .unwrap_or_else(|| format!("banned-{}", name.to_lowercase().replace(" ", "_")));
            
            player_map.insert(uuid.clone(), Player {
                username: name.to_string(),
                uuid: uuid.clone(),
                is_online: false,
                is_op: false,
                is_banned: true,
                is_whitelisted: false,
            });
            
            println!("Joueur banni détecté: {} (UUID: {})", name, uuid);
        }
    }
    
    // Ajouter les OPs (mettre à jour les joueurs existants ou créer de nouveaux)
    for entry in &ops {
        if let Some(name) = entry["name"].as_str() {
            let uuid = entry["uuid"].as_str()
                .map(|u| u.to_string())
                .unwrap_or_else(|| format!("op-{}", name.to_lowercase().replace(" ", "_")));
            
            player_map.entry(uuid.clone())
                .and_modify(|p| {
                    p.is_op = true;
                })
                .or_insert(Player {
                    username: name.to_string(),
                    uuid: uuid.clone(),
                    is_online: false,
                    is_op: true,
                    is_banned: false,
                    is_whitelisted: false,
                });
        }
    }
    
    // Ajouter la whitelist (mettre à jour les joueurs existants ou créer de nouveaux)
    for entry in &whitelist {
        if let Some(name) = entry["name"].as_str() {
            let uuid = entry["uuid"].as_str()
                .map(|u| u.to_string())
                .unwrap_or_else(|| format!("whitelist-{}", name.to_lowercase().replace(" ", "_")));
            
            player_map.entry(uuid.clone())
                .and_modify(|p| {
                    p.is_whitelisted = true;
                })
                .or_insert(Player {
                    username: name.to_string(),
                    uuid: uuid.clone(),
                    is_online: false,
                    is_op: false,
                    is_banned: false,
                    is_whitelisted: true,
                });
        }
    }
    
    // ========== AJOUTER TOUS LES JOUEURS DEPUIS usercache.json ==========
    // usercache.json contient tous les joueurs qui ont déjà connecté au serveur
    let usercache_file = path.join("usercache.json");
    if usercache_file.exists() {
        if let Ok(content) = fs::read_to_string(&usercache_file) {
            if let Ok(users) = serde_json::from_str::<Vec<serde_json::Value>>(&content) {
                for user in users {
                    if let (Some(name), Some(uuid)) = (user["name"].as_str(), user["uuid"].as_str()) {
                        // Vérifier si le joueur existe déjà dans la map
                        if !player_map.contains_key(uuid) {
                            // Vérifier si le joueur est banni, whitelisté ou OP (par nom d'utilisateur)
                            let is_banned = player_map.values()
                                .any(|p| p.username == name && p.is_banned);
                            let is_whitelisted = player_map.values()
                                .any(|p| p.username == name && p.is_whitelisted);
                            let is_op = player_map.values()
                                .any(|p| p.username == name && p.is_op);
                            
                            // Ajouter le joueur s'il n'existe pas encore
                            player_map.insert(uuid.to_string(), Player {
                                username: name.to_string(),
                                uuid: uuid.to_string(),
                                is_online: false, // Sera mis à jour plus tard
                                is_op,
                                is_banned,
                                is_whitelisted,
                            });
                        } else {
                            // Si le joueur existe déjà, mettre à jour le nom d'utilisateur si nécessaire
                            if let Some(player) = player_map.get_mut(uuid) {
                                if player.username != name {
                                    player.username = name.to_string();
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Récupérer les joueurs actuellement connectés depuis les logs
    let online_players = get_online_players(&path).await.unwrap_or_default();
    
    // Mettre à jour le statut en ligne des joueurs
    // D'abord, essayer de matcher par UUID
    for online_player in &online_players {
        if let Some(player) = player_map.get_mut(&online_player.uuid) {
            player.is_online = true;
        }
    }
    
    // Ensuite, essayer de matcher par nom d'utilisateur (pour les joueurs qui n'ont pas encore d'UUID dans les fichiers)
    for online_player in &online_players {
        let mut found = false;
        for player in player_map.values_mut() {
            if player.username == online_player.username {
                player.is_online = true;
                found = true;
                break;
            }
        }
        if !found {
            // Ajouter le joueur s'il n'existe pas encore
            // Mais vérifier d'abord s'il est banni ou whitelisté
            let is_banned = player_map.values()
                .any(|p| p.username == online_player.username && p.is_banned);
            let is_whitelisted = player_map.values()
                .any(|p| p.username == online_player.username && p.is_whitelisted);
            let is_op = player_map.values()
                .any(|p| p.username == online_player.username && p.is_op);
            
            player_map.insert(online_player.uuid.clone(), Player {
                username: online_player.username.clone(),
                uuid: online_player.uuid.clone(),
                is_online: true,
                is_op,
                is_banned,
                is_whitelisted,
            });
        }
    }
    
    // Convertir la HashMap en Vec et s'assurer que tous les joueurs sont inclus
    let mut final_players: Vec<Player> = player_map.into_values().collect();
    
    // Trier par nom pour un affichage cohérent
    final_players.sort_by(|a, b| a.username.cmp(&b.username));
    
    println!("Total joueurs retournés: {} (Bannis: {}, Whitelist: {}, Ops: {})", 
        final_players.len(),
        final_players.iter().filter(|p| p.is_banned).count(),
        final_players.iter().filter(|p| p.is_whitelisted).count(),
        final_players.iter().filter(|p| p.is_op).count()
    );
    
    Ok(final_players)
}

// Fonction pour récupérer les joueurs actuellement connectés
async fn get_online_players(server_path: &std::path::PathBuf) -> Result<Vec<Player>, String> {
    use std::fs;
    use std::io::{BufRead, BufReader};
    
    let logs_path = server_path.join("logs");
    let latest_log = logs_path.join("latest.log");
    
    if !latest_log.exists() {
        return Ok(Vec::new());
    }
    
    // Essayer de forcer la synchronisation du fichier (sur certains systèmes)
    // Cela peut aider à avoir les données les plus récentes
    
    let mut online_players = Vec::new();
    let mut connected_players: std::collections::HashSet<String> = std::collections::HashSet::new();
    
    // Lire les dernières lignes du log (dernières 1000 lignes pour plus de précision)
    if let Ok(file) = fs::File::open(&latest_log) {
        let reader = BufReader::new(file);
        let lines: Vec<String> = reader.lines().collect::<Result<Vec<_>, _>>().unwrap_or_default();
        
        // Prendre les dernières 1000 lignes et les traiter dans l'ordre chronologique
        // (du plus ancien au plus récent) pour avoir l'état actuel correct
        let start_idx = if lines.len() > 1000 {
            lines.len() - 1000
        } else {
            0
        };
        
        // Traiter dans l'ordre chronologique (du plus ancien au plus récent)
        // Cela permet de suivre l'état des joueurs correctement
        for line in lines.iter().skip(start_idx) {
            // Pattern 1: "username[/IP:port] logged in with entity id X"
            if line.contains("logged in with entity id") {
                // Chercher le nom avant le premier '['
                if let Some(bracket_pos) = line.find('[') {
                    // Extraire le nom d'utilisateur (tout ce qui précède le '[')
                    let username_part = &line[..bracket_pos].trim();
                    // Nettoyer le nom (enlever les timestamps et autres préfixes)
                    let username = username_part
                        .split_whitespace()
                        .last()
                        .unwrap_or("")
                        .trim();
                    if !username.is_empty() && !username.contains(':') && !username.contains('[') {
                        connected_players.insert(username.to_string());
                    }
                }
            }
            // Pattern 2: "username joined the game"
            else if line.contains("joined the game") {
                if let Some(pos) = line.find(" joined the game") {
                    let username_part = &line[..pos];
                    let username = username_part
                        .split_whitespace()
                        .last()
                        .unwrap_or("")
                        .trim();
                    if !username.is_empty() && !username.contains(':') && !username.contains('[') {
                        connected_players.insert(username.to_string());
                    }
                }
            }
            // Pattern 3: "username left the game"
            else if line.contains("left the game") {
                if let Some(pos) = line.find(" left the game") {
                    let username_part = &line[..pos];
                    let username = username_part
                        .split_whitespace()
                        .last()
                        .unwrap_or("")
                        .trim();
                    if !username.is_empty() {
                        connected_players.remove(&username.to_string());
                    }
                }
            }
            // Pattern 4: "username lost connection"
            else if line.contains("lost connection") {
                if let Some(pos) = line.find(" lost connection") {
                    let username_part = &line[..pos];
                    let username = username_part
                        .split_whitespace()
                        .last()
                        .unwrap_or("")
                        .trim();
                    if !username.is_empty() {
                        connected_players.remove(&username.to_string());
                    }
                }
            }
            // Pattern 5: "username disconnected"
            else if line.contains("disconnected") {
                if let Some(pos) = line.find(" disconnected") {
                    let username_part = &line[..pos];
                    let username = username_part
                        .split_whitespace()
                        .last()
                        .unwrap_or("")
                        .trim();
                    if !username.is_empty() {
                        connected_players.remove(&username.to_string());
                    }
                }
            }
        }
    }
    
    // Lire usercache.json pour obtenir les UUIDs réels des joueurs
    let usercache_file = server_path.join("usercache.json");
    let mut uuid_map: std::collections::HashMap<String, String> = std::collections::HashMap::new();
    
    if usercache_file.exists() {
        if let Ok(content) = fs::read_to_string(&usercache_file) {
            if let Ok(users) = serde_json::from_str::<Vec<serde_json::Value>>(&content) {
                for user in users {
                    if let (Some(name), Some(uuid)) = (user["name"].as_str(), user["uuid"].as_str()) {
                        uuid_map.insert(name.to_string(), uuid.to_string());
                    }
                }
            }
        }
    }
    
    // Créer les objets Player pour les joueurs connectés
    for username in connected_players {
        // Utiliser l'UUID réel si disponible, sinon générer un temporaire
        let uuid = uuid_map.get(&username)
            .cloned()
            .unwrap_or_else(|| format!("temp-{}", username.to_lowercase().replace(" ", "_")));
        
        online_players.push(Player {
            username: username.clone(),
            uuid,
            is_online: true,
            is_op: false, // Sera mis à jour par la fonction principale
            is_banned: false,
            is_whitelisted: false,
        });
    }
    
    Ok(online_players)
}

// Bannir un joueur
#[tauri::command]
async fn ban_player(server_path: String, username: String, reason: String) -> Result<(), String> {
    let server_name = get_server_name_from_path(&server_path);
    send_server_command(server_name, format!("ban {} {}", username, reason)).await
}

// Débannir un joueur
#[tauri::command]
async fn unban_player(server_path: String, username: String) -> Result<(), String> {
    let server_name = get_server_name_from_path(&server_path);
    send_server_command(server_name, format!("pardon {}", username)).await
}

// Expulser un joueur
#[tauri::command]
async fn kick_player(server_path: String, username: String, reason: String) -> Result<(), String> {
    let server_name = get_server_name_from_path(&server_path);
    send_server_command(server_name, format!("kick {} {}", username, reason)).await
}

// Définir le statut OP d'un joueur
#[tauri::command]
async fn set_player_op(server_path: String, username: String, is_op: bool) -> Result<(), String> {
    let command = if is_op {
        format!("op {}", username)
    } else {
        format!("deop {}", username)
    };
    let server_name = get_server_name_from_path(&server_path);
    send_server_command(server_name, command).await
}

// Gérer la whitelist
#[tauri::command]
async fn set_player_whitelist(server_path: String, username: String, add: bool) -> Result<(), String> {
    let command = if add {
        format!("whitelist add {}", username)
    } else {
        format!("whitelist remove {}", username)
    };
    let server_name = get_server_name_from_path(&server_path);
    send_server_command(server_name, command).await
}

fn main() {
    use tauri::{CustomMenuItem, SystemTray, SystemTrayMenu, SystemTrayEvent, Manager};
    
    // Créer le menu du System Tray
    let show = CustomMenuItem::new("show".to_string(), "Afficher");
    let hide = CustomMenuItem::new("hide".to_string(), "Masquer");
    let quit = CustomMenuItem::new("quit".to_string(), "Quitter");
    
    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_item(hide)
        .add_native_item(tauri::SystemTrayMenuItem::Separator)
        .add_item(quit);
    
    let system_tray = SystemTray::new().with_menu(tray_menu);
    
    tauri::Builder::default()
        .setup(|app| {
            // Configuration spéciale pour Windows avec transparence
            #[cfg(target_os = "windows")]
            {
                use tauri::Manager;
                if let Some(window) = app.get_window("main") {
                    // S'assurer que la fenêtre est bien centrée
                    let _ = window.center();
                }
            }
            Ok(())
        })
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick {
                position: _,
                size: _,
                ..
            } => {
                // Double-clic pour afficher/masquer
                if let Some(window) = app.get_window("main") {
                    if window.is_visible().unwrap_or(false) {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
            SystemTrayEvent::MenuItemClick { id, .. } => {
                match id.as_str() {
                    "show" => {
                        if let Some(window) = app.get_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "hide" => {
                        if let Some(window) = app.get_window("main") {
                            let _ = window.hide();
                        }
                    }
                    "quit" => {
                        println!("Fermeture complète de l'application via system tray...");
                        std::process::exit(0);
                    }
                    _ => {}
                }
            }
            _ => {}
        })
        .on_window_event(|event| match event.event() {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                // Au lieu de fermer, masquer dans le tray
                event.window().hide().unwrap();
                api.prevent_close();
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            create_vanilla_server,
            create_forge_server,
            create_neoforge_server,
            create_mohist_server,
            create_paper_server,
            start_server,
            stop_server,
            get_server_status,
            update_server_properties,
            check_java_version,
            detect_java_versions,
            get_recommended_java_version,
            select_best_java_version,
            delete_server_folder,
            get_server_logs,
            clear_server_logs,
            fix_server_start_script,
            fix_server_network,
            send_server_command,
            get_server_stats,
            list_server_mods,
            toggle_mod,
            delete_mod,
            add_mod,
            create_backup,
            list_backups,
            restore_backup,
            delete_backup,
            enable_auto_backup,
            enable_auto_restart,
            get_available_port,
            download_java_runtime,
            check_java_version,
            cleanup_server_logs,
            cleanup_app_cache,
            check_updates,
            get_optimized_java_flags,
            detect_crash,
            add_player_to_list,
            remove_player_from_list,
            import_modpack,
            export_modpack,
            update_server,
            download_minecraft_version,
            get_minecraft_versions,
            get_paper_versions,
            check_java_installation,
            open_folder,
            send_notification,
            get_system_info,
            get_folder_size,
            get_app_data_path,
            clear_cache,
            check_playit_installation,
            install_playit,
            test_playit_launch,
            start_playit,
            stop_playit,
            get_playit_tunnel_url,
            set_playit_tunnel_url,
            is_playit_running,
            get_playit_detailed_status,
            detect_playit_tunnel_url,
            force_quit,
            install_modpack,
            list_installed_modpacks,
            uninstall_modpack,
            add_mod_from_bytes,
            get_server_players,
            scan_servers_directory,
            detect_server_version,
            ban_player,
            unban_player,
            kick_player,
            set_player_op,
            set_player_whitelist
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
