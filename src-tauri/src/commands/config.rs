use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Represents the result of an environment check for required tools.
#[derive(Debug, Serialize, Deserialize)]
pub struct EnvCheckResult {
    pub scrcpy: bool,
    pub adb: bool,
}

/// Global scrcpy parameters configurable via the UI.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScrcpyParams {
    // Boolean flags
    pub turn_screen_off: bool,
    pub keyboard_uhid: bool,
    pub mouse_uhid: bool,
    pub stay_awake: bool,
    pub always_on_top: bool,
    // Numeric / string values
    pub max_size: Option<u32>,
    pub max_fps: Option<u32>,
    pub video_bit_rate: String,
    pub video_codec: Option<String>,
    pub audio_codec: Option<String>,
    // New display composite
    pub new_display_resolution: Option<String>,
    pub new_display_dpi: Option<u32>,
}

impl Default for ScrcpyParams {
    fn default() -> Self {
        Self {
            turn_screen_off: false,
            keyboard_uhid: false,
            mouse_uhid: false,
            stay_awake: false,
            always_on_top: false,
            max_size: None,
            max_fps: None,
            video_bit_rate: "24M".to_string(),
            video_codec: None,
            audio_codec: None,
            new_display_resolution: None,
            new_display_dpi: None,
        }
    }
}

/// Persisted application configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub scrcpy_path: Option<String>,
    pub adb_path: Option<String>,
    pub favorite_packages: Vec<String>,
    #[serde(default)]
    pub params: ScrcpyParams,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            scrcpy_path: None,
            adb_path: None,
            favorite_packages: vec![],
            params: ScrcpyParams::default(),
        }
    }
}

/// Checks whether `scrcpy` and `adb` executables are available in the system PATH.
#[tauri::command]
pub fn check_environment() -> EnvCheckResult {
    EnvCheckResult {
        scrcpy: find_in_path("scrcpy"),
        adb: find_in_path("adb"),
    }
}

/// Returns the path to the config file in the app data directory.
fn config_path() -> PathBuf {
    let base = dirs::data_local_dir()
        .or_else(|| dirs::data_dir())
        .unwrap_or_else(|| PathBuf::from("."));
    base.join("scrcpy-launcher").join("config.json")
}

/// Reads the persisted configuration from disk.
/// Returns the default config if no file exists yet.
#[tauri::command]
pub fn get_config() -> AppConfig {
    let path = config_path();
    if path.exists() {
        match std::fs::read_to_string(&path) {
            Ok(contents) => serde_json::from_str(&contents).unwrap_or_default(),
            Err(_) => AppConfig::default(),
        }
    } else {
        AppConfig::default()
    }
}

/// Persists the configuration to disk.
/// Creates parent directories if they don't exist.
#[tauri::command]
pub fn save_config(config: AppConfig) -> Result<(), String> {
    let path = config_path();
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| format!("Failed to create config dir: {}", e))?;
    }
    let contents =
        serde_json::to_string_pretty(&config).map_err(|e| format!("Failed to serialize: {}", e))?;
    std::fs::write(&path, contents).map_err(|e| format!("Failed to write config: {}", e))?;
    Ok(())
}

/// Searches for an executable in the system PATH and common install directories.
fn find_in_path(cmd: &str) -> bool {
    let cmd_name = if cfg!(target_os = "windows") && !cmd.ends_with(".exe") {
        format!("{}.exe", cmd)
    } else {
        cmd.to_string()
    };

    if which_in_path(&cmd_name) {
        return true;
    }

    // Platform-specific extra directories
    #[cfg(target_os = "windows")]
    {
        let extra_dirs = [
            std::env::var("USERPROFILE")
                .map(|p| PathBuf::from(p).join("scoop").join("shims"))
                .ok(),
            Some(PathBuf::from("C:\\ProgramData\\chocolatey\\bin")),
            Some(PathBuf::from("C:\\scrcpy")),
            std::env::var("LOCALAPPDATA")
                .map(|p| {
                    PathBuf::from(p)
                        .join("Android")
                        .join("Sdk")
                        .join("platform-tools")
                })
                .ok(),
            std::env::var("ANDROID_HOME")
                .map(|p| PathBuf::from(p).join("platform-tools"))
                .ok(),
        ];
        for dir in extra_dirs.into_iter().flatten() {
            if dir.join(&cmd_name).exists() {
                return true;
            }
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        for dir in ["/usr/local/bin", "/opt/homebrew/bin", "/usr/bin"] {
            if PathBuf::from(dir).join(&cmd_name).exists() {
                return true;
            }
        }
    }

    false
}

/// Checks each directory in PATH for a given executable name.
fn which_in_path(cmd: &str) -> bool {
    if let Ok(path_var) = std::env::var("PATH") {
        let sep = if cfg!(target_os = "windows") { ';' } else { ':' };
        for dir in path_var.split(sep) {
            if PathBuf::from(dir).join(cmd).exists() {
                return true;
            }
        }
    }
    false
}
