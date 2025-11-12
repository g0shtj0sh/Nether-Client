// Module d'automatisation pour Nether Client
use std::time::Duration;
use std::path::PathBuf;
use std::fs;
use std::io::Write;

// Détection automatique de crashes
pub fn detect_crash_in_logs(logs: &[String]) -> bool {
    let crash_keywords = [
        "Exception",
        "Error",
        "Crash",
        "Fatal",
        "java.lang.OutOfMemoryError",
        "java.lang.StackOverflowError",
        "Server crashed",
    ];
    
    logs.iter().rev().take(20).any(|log| {
        crash_keywords.iter().any(|keyword| log.contains(keyword))
    })
}

// Optimisation automatique des flags Java selon la version
pub fn get_optimized_java_flags(ram_mb: u32, version: &str, server_type: &str) -> Vec<String> {
    let ram_gb = ram_mb / 1024;
    let mut flags = vec![
        format!("-Xmx{}G", ram_gb),
        format!("-Xms{}G", ram_gb / 2),
    ];
    
    // Flags optimisés pour Java 17+
    if version.starts_with("1.18") || version.starts_with("1.19") || version.starts_with("1.20") || version.starts_with("1.21") {
        flags.extend(vec![
            "-XX:+UseG1GC".to_string(),
            "-XX:+ParallelRefProcEnabled".to_string(),
            "-XX:MaxGCPauseMillis=200".to_string(),
            "-XX:+UnlockExperimentalVMOptions".to_string(),
            "-XX:+DisableExplicitGC".to_string(),
            "-XX:+AlwaysPreTouch".to_string(),
            "-XX:G1NewSizePercent=30".to_string(),
            "-XX:G1MaxNewSizePercent=40".to_string(),
            "-XX:G1HeapRegionSize=8M".to_string(),
            "-XX:G1ReservePercent=20".to_string(),
            "-XX:G1HeapWastePercent=5".to_string(),
            "-XX:G1MixedGCCountTarget=4".to_string(),
            "-XX:InitiatingHeapOccupancyPercent=15".to_string(),
            "-XX:G1MixedGCLiveThresholdPercent=90".to_string(),
            "-XX:G1RSetUpdatingPauseTimePercent=5".to_string(),
            "-XX:SurvivorRatio=32".to_string(),
            "-XX:+PerfDisableSharedMem".to_string(),
            "-XX:MaxTenuringThreshold=1".to_string(),
        ]);
    } else {
        // Flags pour Java 8
        flags.extend(vec![
            "-XX:+UseG1GC".to_string(),
            "-XX:+UnlockExperimentalVMOptions".to_string(),
            "-XX:MaxGCPauseMillis=100".to_string(),
            "-XX:+DisableExplicitGC".to_string(),
            "-XX:TargetSurvivorRatio=90".to_string(),
            "-XX:G1NewSizePercent=50".to_string(),
            "-XX:G1MaxNewSizePercent=80".to_string(),
            "-XX:InitiatingHeapOccupancyPercent=10".to_string(),
            "-XX:G1MixedGCLiveThresholdPercent=50".to_string(),
        ]);
    }
    
    // Flags spécifiques pour les serveurs moddés
    if server_type == "forge" || server_type == "neoforge" {
        flags.push("-Dfml.readTimeout=180".to_string());
    }
    
    flags
}

// Trouver un port disponible automatiquement
pub fn find_available_port(start_port: u16) -> Result<u16, String> {
    use std::net::TcpListener;
    
    for port in start_port..start_port + 100 {
        if TcpListener::bind(("127.0.0.1", port)).is_ok() {
            return Ok(port);
        }
    }
    
    Err("Aucun port disponible trouvé".to_string())
}

// Vérifier si Java est installé et obtenir la version
pub fn check_java_version() -> Option<String> {
    use std::process::Command;
    
    if let Ok(output) = Command::new("java").arg("-version").output() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        if let Some(line) = stderr.lines().next() {
            return Some(line.to_string());
        }
    }
    
    None
}

// Télécharger Java automatiquement
pub async fn download_java(version: u8) -> Result<String, String> {
    // URLs des distributions Adoptium (anciennement AdoptOpenJDK)
    let url = match version {
        8 => "https://api.adoptium.net/v3/binary/latest/8/ga/windows/x64/jdk/hotspot/normal/eclipse",
        17 => "https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse",
        21 => "https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jdk/hotspot/normal/eclipse",
        _ => return Err("Version Java non supportée".to_string()),
    };
    
    let app_data = std::env::var("APPDATA").map_err(|e| e.to_string())?;
    let java_path = PathBuf::from(&app_data)
        .join("NetherClient")
        .join("java")
        .join(format!("jdk-{}", version));
    
    fs::create_dir_all(&java_path)
        .map_err(|e| format!("Erreur création dossier Java: {}", e))?;
    
    println!("Téléchargement de Java {}...", version);
    
    // Télécharger le fichier
    let client = reqwest::Client::new();
    let response = client.get(url)
        .send()
        .await
        .map_err(|e| format!("Erreur téléchargement: {}", e))?;
    
    let bytes = response.bytes()
        .await
        .map_err(|e| format!("Erreur lecture: {}", e))?;
    
    let zip_path = java_path.join("jdk.zip");
    let mut file = fs::File::create(&zip_path)
        .map_err(|e| format!("Erreur création fichier: {}", e))?;
    
    file.write_all(&bytes)
        .map_err(|e| format!("Erreur écriture: {}", e))?;
    
    println!("Java {} téléchargé avec succès", version);
    
    // Extraire le ZIP
    extract_java_zip(&zip_path, &java_path)?;
    
    // Supprimer le ZIP
    let _ = fs::remove_file(&zip_path);
    
    Ok(java_path.to_string_lossy().to_string())
}

// Extraire le ZIP Java
fn extract_java_zip(zip_path: &PathBuf, extract_to: &PathBuf) -> Result<(), String> {
    use zip::ZipArchive;
    
    let file = fs::File::open(zip_path)
        .map_err(|e| format!("Erreur ouverture ZIP: {}", e))?;
    
    let mut archive = ZipArchive::new(file)
        .map_err(|e| format!("Erreur lecture ZIP: {}", e))?;
    
    for i in 0..archive.len() {
        let mut file = archive.by_index(i)
            .map_err(|e| format!("Erreur extraction: {}", e))?;
        
        let outpath = extract_to.join(file.name());
        
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
                .map_err(|e| format!("Erreur copie: {}", e))?;
        }
    }
    
    Ok(())
}

// Nettoyage automatique des logs
pub fn cleanup_old_logs(server_path: &str, days_to_keep: u64) -> Result<(), String> {
    use std::time::SystemTime;
    
    let logs_path = PathBuf::from(server_path).join("logs");
    
    if !logs_path.exists() {
        return Ok(());
    }
    
    let cutoff_time = SystemTime::now() - Duration::from_secs(days_to_keep * 24 * 3600);
    
    for entry in fs::read_dir(&logs_path).map_err(|e| format!("Erreur lecture logs: {}", e))? {
        let entry = entry.map_err(|e| format!("Erreur entrée: {}", e))?;
        let path = entry.path();
        
        if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("log") {
            if let Ok(metadata) = entry.metadata() {
                if let Ok(modified) = metadata.modified() {
                    if modified < cutoff_time {
                        let _ = fs::remove_file(&path);
                        println!("Log ancien supprimé: {:?}", path.file_name());
                    }
                }
            }
        }
    }
    
    Ok(())
}

// Nettoyage automatique du cache
pub fn cleanup_cache() -> Result<u64, String> {
    let app_data = std::env::var("APPDATA").map_err(|e| e.to_string())?;
    let cache_path = PathBuf::from(&app_data)
        .join("NetherClient")
        .join("cache");
    
    if !cache_path.exists() {
        return Ok(0);
    }
    
    let mut total_freed = 0u64;
    
    for entry in fs::read_dir(&cache_path).map_err(|e| format!("Erreur lecture cache: {}", e))? {
        let entry = entry.map_err(|e| format!("Erreur entrée: {}", e))?;
        let path = entry.path();
        
        if let Ok(metadata) = entry.metadata() {
            total_freed += metadata.len();
        }
        
        if path.is_file() {
            let _ = fs::remove_file(&path);
        } else if path.is_dir() {
            let _ = fs::remove_dir_all(&path);
        }
    }
    
    println!("Cache nettoyé: {} octets libérés", total_freed);
    
    Ok(total_freed)
}

// Vérifier les mises à jour disponibles pour un serveur
pub async fn check_server_updates(version: &str, server_type: &str) -> Result<Option<String>, String> {
    match server_type {
        "vanilla" => check_vanilla_updates(version).await,
        "forge" => check_forge_updates(version).await,
        "neoforge" => check_neoforge_updates(version).await,
        _ => Ok(None),
    }
}

async fn check_vanilla_updates(current_version: &str) -> Result<Option<String>, String> {
    let client = reqwest::Client::new();
    let manifest_url = "https://launchermeta.mojang.com/mc/game/version_manifest_v2.json";
    
    let manifest: serde_json::Value = client
        .get(manifest_url)
        .send()
        .await
        .map_err(|e| format!("Erreur: {}", e))?
        .json()
        .await
        .map_err(|e| format!("Erreur JSON: {}", e))?;
    
    if let Some(latest) = manifest["latest"]["release"].as_str() {
        if latest != current_version {
            return Ok(Some(latest.to_string()));
        }
    }
    
    Ok(None)
}

async fn check_forge_updates(_current_version: &str) -> Result<Option<String>, String> {
    // Implémentation simplifiée - à améliorer
    Ok(None)
}

async fn check_neoforge_updates(_current_version: &str) -> Result<Option<String>, String> {
    // Implémentation simplifiée - à améliorer
    Ok(None)
}

