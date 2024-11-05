use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen]
pub fn greet_rs() -> String {
  "Hello from Rust!".to_string()
}