#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use libc;
use obfstr::obfstr;
use std::process;
use tauri::Listener;
use tauri::Manager;
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial, NSVisualEffectState};
use std::io::Write;
use std::net::{IpAddr, Ipv4Addr, Shutdown, SocketAddr, TcpStream};
use std::time::Duration;

#[tauri::command]
fn execute_script(script: String) -> Result<String, String> {
    let script_bytes = script.as_bytes();
    let total_len = script_bytes
        .len()
        .checked_add(1)
        .ok_or_else(|| "Script is too large to send".to_string())?;

    if total_len > u32::MAX as usize {
        return Err("Script is too large to send".into());
    }

    let mut header = [0u8; 16];
    header[8..12].copy_from_slice(&(total_len as u32).to_le_bytes());

    let timeout = Duration::from_millis(3000);
    let addr = SocketAddr::new(IpAddr::V4(Ipv4Addr::new(127, 0, 0, 1)), 5553);

    let mut stream = TcpStream::connect_timeout(&addr, timeout)
        .map_err(|e| format!("Failed to connect: {}", e))?;

    stream
        .set_write_timeout(Some(timeout))
        .map_err(|e| format!("Failed to set write timeout: {}", e))?;
    stream
        .set_read_timeout(Some(timeout))
        .map_err(|e| format!("Failed to set read timeout: {}", e))?;

    stream
        .write_all(&header)
        .map_err(|e| format!("Failed to write header: {}", e))?;
    stream
        .write_all(script_bytes)
        .map_err(|e| format!("Failed to write script: {}", e))?;
    stream
        .write_all(&[0u8])
        .map_err(|e| format!("Failed to write null terminator: {}", e))?;

    stream
        .flush()
        .map_err(|e| format!("Failed to flush stream: {}", e))?;
    let _ = stream.shutdown(Shutdown::Both);

    Ok("Script executed successfully".to_string())
}

fn main() {
    use std::io::{self, Write};

    std::thread::spawn(|| loop {
        protect_memory();
        if detect_debugger() || check_environment() {
            println!("Decompiler detected! Get a load of this nigga!");
            io::stdout().flush().unwrap();
            process::exit(1);
        }
        std::thread::sleep(std::time::Duration::from_secs(1));
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![execute_script])
        .setup(|app| {
            // Get the main window of the application
            let window = app.get_webview_window(obfstr!("main")).unwrap();

            #[cfg(target_os = "macos")]
            {
                // Apply vibrancy effect to the window on macOS
                apply_vibrancy(
                    &window,
                    NSVisualEffectMaterial::HudWindow,
                    Some(NSVisualEffectState::FollowsWindowActiveState),
                    Some(15.0),
                )
                .expect(obfstr!(
                    "Unsupported platform! 'apply_vibrancy' is only supported on macOS"
                ));
            }

            window.listen("check_integrity", move |_| {
                if detect_debugger() || check_environment() {
                    println!("Your enviroment sus gang, ima have to kms 💔");
                    io::stdout().flush().unwrap();
                    process::exit(1);
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(target_os = "macos")]
fn detect_debugger() -> bool {
    use libc::{c_void, ptrace, sysctl, PT_DENY_ATTACH};
    use std::io::{self, Write};
    use std::ptr;

    // Prevent debugging / decompiling by calling ptrace with PT_DENY_ATTACH
    unsafe {
        ptrace(PT_DENY_ATTACH, 0, ptr::null_mut(), 0);
    }

    unsafe {
        if ptrace(PT_DENY_ATTACH, 0, ptr::null_mut(), 0) == -1 {
            println!("Decompiler detected! Get a load of this nigga!");
            io::stdout().flush().unwrap();
            std::thread::sleep(std::time::Duration::from_secs(1));
            return true;
        }
    }

    // Fallback: Check using sysctl
    let mut size = 0_usize;
    let mut mib: [i32; 4] = [6, 1, 14, process::id() as i32];

    unsafe {
        sysctl(
            mib.as_mut_ptr(),
            4,
            ptr::null_mut(),
            &mut size as *mut usize,
            ptr::null_mut(),
            0,
        );

        let mut buffer = vec![0u8; size];

        if sysctl(
            mib.as_mut_ptr(),
            4,
            buffer.as_mut_ptr() as *mut c_void,
            &mut size as *mut usize,
            ptr::null_mut(),
            0,
        ) == -1
        {
            return false;
        }

        let traced_bit = 0x800;
        let flags = *(buffer.as_ptr().add(0x68) as *const i32);
        (flags & traced_bit) != 0
    }
}

#[cfg(not(target_os = "macos"))]
fn detect_debugger() -> bool {
    true
}

/*
fn obfuscate_string(s: &str) -> String {
    let key = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as u8;

    s.bytes()
        .map(|b| b ^ key)
        .map(|b| format!("\\x{:02x}", b))
        .collect()
}
*/

// Check execution environment

#[cfg(target_os = "macos")]
fn check_environment() -> bool {
    use std::process::Command;

    let suspicious_processes = [
    "Binary Ninja", "Hopper", "ida64", "ida32", "Ghidra", "lldb", "gdb", "radare2", "strace", "dtrace"
];

    if let Ok(output) = Command::new("ps").arg("aux").output() {
        let process_list = String::from_utf8_lossy(&output.stdout);
        for process in &suspicious_processes {
            if process_list.contains(process) {
                return true;
            }
        }
    }
    false
}

#[cfg(target_os = "macos")]
use libc::mlockall;
pub fn protect_memory() {
    unsafe { mlockall(libc::MCL_CURRENT | libc::MCL_FUTURE); }
}

