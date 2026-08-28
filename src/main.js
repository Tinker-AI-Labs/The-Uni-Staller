// Minimal entry point — app logic is in app.js, bridge is in tauri-bridge.js
console.log('[Uni-Staller] Frontend loaded. Tauri:', typeof window !== 'undefined' && !!window.__TAURI__ ? 'YES' : 'NO');
