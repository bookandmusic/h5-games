use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

const STORAGE_FILE: &str = "game_states.json";

#[derive(Debug, Serialize, Deserialize)]
struct GameStates {
    games: HashMap<String, serde_json::Value>,
}

fn get_storage_path(app: &tauri::AppHandle) -> PathBuf {
    let app_dir = app.path().app_data_dir().expect("failed to get app data dir");
    if !app_dir.exists() {
        fs::create_dir_all(&app_dir).expect("failed to create app data dir");
    }
    app_dir.join(STORAGE_FILE)
}

fn load_storage_file(path: &PathBuf) -> GameStates {
    if path.exists() {
        let content = fs::read_to_string(path).expect("failed to read storage file");
        serde_json::from_str(&content).expect("failed to parse storage file")
    } else {
        GameStates {
            games: HashMap::new(),
        }
    }
}

fn save_storage_file(path: &PathBuf, states: &GameStates) {
    let content = serde_json::to_string_pretty(states).expect("failed to serialize storage");
    fs::write(path, content).expect("failed to write storage file");
}

#[tauri::command]
fn save_game_state(app: tauri::AppHandle, game_id: String, state: serde_json::Value) -> bool {
    let path = get_storage_path(&app);
    let mut storage = load_storage_file(&path);
    storage.games.insert(game_id, state);
    save_storage_file(&path, &storage);
    true
}

#[tauri::command]
fn load_game_state(app: tauri::AppHandle, game_id: String) -> Option<serde_json::Value> {
    let path = get_storage_path(&app);
    let storage = load_storage_file(&path);
    storage.games.get(&game_id).cloned()
}

#[tauri::command]
fn clear_game_state(app: tauri::AppHandle, game_id: String) -> bool {
    let path = get_storage_path(&app);
    let mut storage = load_storage_file(&path);
    storage.games.remove(&game_id);
    save_storage_file(&path, &storage);
    true
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![save_game_state, load_game_state, clear_game_state])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}