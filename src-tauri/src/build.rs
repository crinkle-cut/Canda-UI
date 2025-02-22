use std::fs;
use std::path::Path;
use aes::{Aes256, BlockEncrypt, NewBlockCipher};
use aes::block_cipher_trait::generic_array::GenericArray;
use rand::{RngCore, rngs::OsRng};
use base64::encode;
use regex::Regex;

fn main() {
    // Path to the Rust source file you want to obfuscate
    let src_path = Path::new("src-tauri/main.rs");
    
    // Read the Rust source file
    let mut content = fs::read_to_string(src_path).expect("Unable to read file");

    // Create a regex to match all string literals
    let re = Regex::new(r#""([^"\\]*(\\.[^"\\]*)*)""#).unwrap();

    // For each match (string literal), obfuscate the string
    for capture in re.captures_iter(&content) {
        let original_str = &capture[0];
        let encrypted_str = encrypt_string(original_str.trim_matches('"'));

        // Replace the string literal with the encrypted version
        let obfuscated_str = format!(r#""{}""#, encrypted_str);
        content = content.replace(original_str, &obfuscated_str);
    }

    // Write the modified content back to the file
    fs::write(src_path, content).expect("Unable to write file");
}

fn encrypt_string(input: &str) -> String {
    // Generate a random 256-bit AES key
    let mut key = [0u8; 32];
    OsRng.fill_bytes(&mut key);

    // Create AES cipher with the key
    let cipher = Aes256::new(&GenericArray::from_slice(&key));

    // Pad the input string to be a multiple of the block size (AES block size is 128 bits, or 16 bytes)
    let mut padded_input = input.as_bytes().to_vec();
    while padded_input.len() % 16 != 0 {
        padded_input.push(0);
    }

    // Encrypt the input string (blocks of 16 bytes)
    let mut encrypted = vec![0u8; padded_input.len()];
    for chunk in padded_input.chunks_mut(16) {
        let block = GenericArray::from_mut_slice(chunk);
        cipher.encrypt_block(block);
    }

    // Return the encrypted string (base64 encoded for readability)
    encode(&encrypted)
}

// I deadass wrote all this and idk if it works 💀💔😭