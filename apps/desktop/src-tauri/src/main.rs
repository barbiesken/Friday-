// FRIDAY desktop shell. The native side of the SystemBridge interface
// (apps/desktop/src/system/bridge.ts) — same method names, real OS behavior.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use tauri::{
    CustomMenuItem, GlobalShortcutManager, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu,
};

#[tauri::command]
fn open_app(name: String) -> Result<(), String> {
    open_target(&name).map_err(|e| e.to_string())
}

#[tauri::command]
fn set_volume(level: f64) -> Result<(), String> {
    let pct = (level.clamp(0.0, 1.0) * 100.0).round() as i64;
    #[cfg(target_os = "macos")]
    Command::new("osascript")
        .args(["-e", &format!("set volume output volume {}", pct)])
        .spawn()
        .map_err(|e| e.to_string())?;
    #[cfg(target_os = "linux")]
    Command::new("amixer")
        .args(["set", "Master", &format!("{}%", pct)])
        .spawn()
        .map_err(|e| e.to_string())?;
    let _ = pct;
    Ok(())
}

#[tauri::command]
fn set_brightness(_level: f64) -> Result<(), String> {
    // Platform brightness control is OS-specific (e.g. `brightness` on macOS,
    // `xrandr`/`brightnessctl` on Linux). Wired here in a later pass.
    Ok(())
}

#[tauri::command]
fn focus_mode(_on: bool) -> Result<(), String> {
    // Hook OS Do-Not-Disturb / Focus here.
    Ok(())
}

#[tauri::command]
fn run_chain(steps: Vec<String>) -> Result<(), String> {
    for step in steps {
        let _ = open_target(&step);
    }
    Ok(())
}

#[tauri::command]
fn notify(app: tauri::AppHandle, title: String, body: Option<String>) -> Result<(), String> {
    use tauri::api::notification::Notification;
    Notification::new(&app.config().tauri.bundle.identifier)
        .title(title)
        .body(body.unwrap_or_default())
        .show()
        .map_err(|e| e.to_string())
}

fn open_target(name: &str) -> std::io::Result<()> {
    #[cfg(target_os = "macos")]
    {
        Command::new("open").arg("-a").arg(name).spawn()?;
    }
    #[cfg(target_os = "windows")]
    {
        Command::new("cmd").args(["/C", "start", "", name]).spawn()?;
    }
    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open").arg(name).spawn()?;
    }
    Ok(())
}

fn main() {
    let tray = SystemTray::new().with_menu(
        SystemTrayMenu::new()
            .add_item(CustomMenuItem::new("show", "Show FRIDAY"))
            .add_item(CustomMenuItem::new("quit", "Quit")),
    );

    tauri::Builder::default()
        .system_tray(tray)
        .on_system_tray_event(|app, event| {
            if let SystemTrayEvent::MenuItemClick { id, .. } = event {
                match id.as_str() {
                    "show" => {
                        if let Some(w) = app.get_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                    "quit" => std::process::exit(0),
                    _ => {}
                }
            }
        })
        .setup(|app| {
            // Global wake hotkey: Cmd/Ctrl+Shift+F → focus the window and tell the
            // renderer to wake (the bridge listens for "friday://wake").
            let handle = app.handle();
            let mut shortcuts = app.global_shortcut_manager();
            let _ = shortcuts.register("CmdOrCtrl+Shift+F", move || {
                if let Some(w) = handle.get_window("main") {
                    let _ = w.show();
                    let _ = w.set_focus();
                    let _ = w.emit("friday://wake", ());
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            open_app, set_volume, set_brightness, focus_mode, run_chain, notify
        ])
        .run(tauri::generate_context!())
        .expect("error while running FRIDAY");
}
