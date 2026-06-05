mod commands;

use commands::config::{check_environment, get_config, save_config};
use commands::icons::{
    get_cached_icon, get_icon_cache_dir, read_cached_icon, save_cached_icon,
};

/// Main entry point for the Tauri application.
/// Registers plugins, commands, and runs the app.
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            check_environment,
            get_config,
            save_config,
            get_icon_cache_dir,
            save_cached_icon,
            get_cached_icon,
            read_cached_icon,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Scrcpy Launcher");
}
