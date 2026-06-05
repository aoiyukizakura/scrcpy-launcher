use std::path::PathBuf;

/// Returns the directory where app icons are cached.
/// Creates the directory if it doesn't exist.
#[tauri::command]
pub fn get_icon_cache_dir() -> Result<String, String> {
    let dir = icon_cache_dir();
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create icon cache dir: {}", e))?;
    Ok(dir.to_string_lossy().to_string())
}

/// Saves a base64-encoded PNG icon to the cache directory.
/// Returns the file path of the saved icon.
/// The frontend can later read this file and display it as a data URL.
#[tauri::command]
pub fn save_cached_icon(package_name: String, icon_base64: String) -> Result<String, String> {
    let dir = icon_cache_dir();
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create icon cache dir: {}", e))?;

    // Decode base64 to raw bytes
    let bytes = base64_decode(&icon_base64)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;

    let file_path = icon_cache_path(&package_name);
    std::fs::write(&file_path, &bytes)
        .map_err(|e| format!("Failed to write icon: {}", e))?;

    Ok(file_path.to_string_lossy().to_string())
}

/// Checks if a cached icon exists for the given package and returns its path.
/// Returns `None` if no cached icon is found.
#[tauri::command]
pub fn get_cached_icon(package_name: String) -> Option<String> {
    let path = icon_cache_path(&package_name);
    if path.exists() {
        Some(path.to_string_lossy().to_string())
    } else {
        None
    }
}

/// Reads a cached icon and returns it as a base64-encoded data URL string,
/// ready to be used as an `src` attribute in an `<img>` tag.
#[tauri::command]
pub fn read_cached_icon(package_name: String) -> Result<Option<String>, String> {
    let path = icon_cache_path(&package_name);
    if !path.exists() {
        return Ok(None);
    }
    let bytes = std::fs::read(&path)
        .map_err(|e| format!("Failed to read icon: {}", e))?;
    let b64 = base64_encode(&bytes);
    Ok(Some(format!("data:image/png;base64,{}", b64)))
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/// Base directory for all application cache data.
fn icon_cache_dir() -> PathBuf {
    let base = dirs::cache_dir()
        .or_else(|| dirs::data_local_dir())
        .or_else(|| dirs::data_dir())
        .unwrap_or_else(|| PathBuf::from("."));
    base.join("scrcpy-launcher").join("icons")
}

/// Full path to a cached icon file for a given package name.
fn icon_cache_path(package_name: &str) -> PathBuf {
    icon_cache_dir().join(format!("{}.png", package_name))
}

/// Simple base64 decode without external dependencies.
/// Uses a minimal character-to-byte mapping for the standard base64 alphabet.
fn base64_decode(input: &str) -> Result<Vec<u8>, String> {
    // Strip data URL prefix if present: "data:image/png;base64,..."
    let encoded = if let Some(comma_pos) = input.find(',') {
        &input[comma_pos + 1..]
    } else {
        input
    };

    let mut result = Vec::with_capacity(encoded.len() * 3 / 4);
    let mut buffer: u32 = 0;
    let mut bits_collected: u32 = 0;

    for ch in encoded.chars() {
        if ch.is_whitespace() {
            continue;
        }
        let value = match ch {
            'A'..='Z' => ch as u32 - 'A' as u32,
            'a'..='z' => ch as u32 - 'a' as u32 + 26,
            '0'..='9' => ch as u32 - '0' as u32 + 52,
            '+' => 62,
            '/' => 63,
            '=' => break, // Padding reached — stop
            _ => continue, // Skip unknown characters
        };
        buffer = (buffer << 6) | value;
        bits_collected += 6;
        if bits_collected >= 8 {
            bits_collected -= 8;
            result.push((buffer >> bits_collected) as u8);
            buffer &= (1 << bits_collected) - 1;
        }
    }
    Ok(result)
}

/// Simple base64 encode.
fn base64_encode(input: &[u8]) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut result = String::with_capacity(input.len() * 4 / 3 + 4);

    for chunk in input.chunks(3) {
        let b0 = chunk[0] as u32;
        let b1 = if chunk.len() > 1 { chunk[1] as u32 } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] as u32 } else { 0 };
        let triple = (b0 << 16) | (b1 << 8) | b2;

        result.push(CHARS[((triple >> 18) & 63) as usize] as char);
        result.push(CHARS[((triple >> 12) & 63) as usize] as char);

        if chunk.len() > 1 {
            result.push(CHARS[((triple >> 6) & 63) as usize] as char);
        } else {
            result.push('=');
        }

        if chunk.len() > 2 {
            result.push(CHARS[(triple & 63) as usize] as char);
        } else {
            result.push('=');
        }
    }
    result
}
