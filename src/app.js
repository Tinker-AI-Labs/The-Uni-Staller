// ═══════════════════════════════════════════════════════════════
// OPENROUTER API KEY VERIFICATION
// ═══════════════════════════════════════════════════════════════
async function verifyOpenRouterKey(key) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    const statusCode = response.status;
    let data = {};
    try {
      data = await response.json();
    } catch (e) {}
    
    return {
      valid: statusCode === 200,
      statusCode,
      data,
      error: statusCode !== 200 ? (data.error?.message || `HTTP ${statusCode}`) : null
    };
  } catch (err) {
    return {
      valid: false,
      statusCode: 0,
      data: {},
      error: `Network error: ${err.message}`
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// OPENROUTER
// ═══════════════════════════════════════════════════════════════
function toggleOR() {
  const p=document.getElementById('orPanel');
  p.classList.toggle('open');
  document.getElementById('orChevron').textContent=p.classList.contains('open')?'▲':'▼';
}
function toggleORvis() {
  orVisible=!orVisible;
  document.getElementById('orKey').type=orVisible?'text':'password';
  document.querySelector('.or-show').textContent=orVisible?'🙈 HIDE':'👁 SHOW';
}
function clearOR() {
  document.getElementById('orKey').value='';
  document.getElementById('orStatus').className='or-status info';
  document.getElementById('orStatus').textContent='Paste your OpenRouter key and click IMPORT.';
  document.getElementById('orOut').classList.remove('show');
}
function copyOR() {
  navigator.clipboard.writeText(document.getElementById('orCode').textContent).then(()=>{
    const b=document.querySelector('#orOut .or-show'); b.textContent='[ COPIED! ]';
    setTimeout(()=>b.textContent='[ COPY ]',2000);
  });
}

async function applyOR() {
  const key = document.getElementById('orKey').value.trim();
  const st = document.getElementById('orStatus');
  const statusEl = document.getElementById('orOut');
  
  if (!key) {
    st.className = 'or-status err';
    st.textContent = '✕ No key entered.';
    return;
  }
  
  if (!key.startsWith('sk-or')) {
    st.className = 'or-status err';
    st.textContent = '✕ Invalid format — should start with sk-or-...';
    return;
  }
  
  const masked = key.slice(0, 12) + '••••••••••••' + key.slice(-4);
  st.className = 'or-status info';
  st.textContent = '🔄 Verifying key with OpenRouter API...';
  
  const verification = await verifyOpenRouterKey(key);
  
  if (!verification.valid) {
    st.className = 'or-status err';
    st.textContent = `✕ Key verification failed: ${verification.error || `HTTP ${verification.statusCode}`}`;
    statusEl.classList.remove('show');
    return;
  }
  
  st.className = 'or-status ok';
  st.textContent = `✓ Key verified: ${masked}`;
  
  const isLinux = detectedOS !== 'win';
  document.getElementById('orCode').textContent = buildORScript(key, isLinux);
  statusEl.classList.add('show');
  
  document.getElementById('orLabel').textContent = isLinux 
    ? '// LINUX BASH — paste into konsole and hit Enter' 
    : '// POWERSHELL — save as setup_openrouter.ps1 and run as Admin';
  
  document.getElementById('orHint').textContent = isLinux 
    ? '⚠ Do NOT run as ./script.sh in fish — paste directly or: bash setup_openrouter.sh' 
    : '⚠ Right-click PowerShell → Run as Administrator before pasting';
}

function buildORScript(key, isLinux) {
  const masked = key.slice(0, 12) + '...' + key.slice(-4);
  
  if (!isLinux) {
    // Windows PowerShell
    return `# T1NK3R-VER53 // OpenRouter Key Setup — WINDOWS / TINY11
# Save as setup_openrouter.ps1 — Run in PowerShell as Admin
# ══════════════════════════════════════════════════════════════
$keyValue = "${key}"
$envDir = "$env:APPDATA\\tinker-verse"
$envFile = "$envDir\\openrouter.env"
if (!(Test-Path $envDir)) { New-Item -ItemType Directory -Force -Path $envDir | Out-Null }
@"
OPENROUTER_API_KEY=$keyValue
OR_BASE_URL=https://openrouter.ai/api/v1
"@ | Set-Content $envFile -Encoding UTF8
[System.Environment]::SetEnvironmentVariable("OPENROUTER_API_KEY", $keyValue, "User")
[System.Environment]::SetEnvironmentVariable("OR_BASE_URL", "https://openrouter.ai/api/v1", "User")
Write-Host "OK Key set: ${masked}" -ForegroundColor Green
Write-Host "OK Env file: $envFile" -ForegroundColor Green
Write-Host ""
Write-Host "WARNING: Terminal Staleness" -ForegroundColor Yellow
Write-Host "Only NEW PowerShell sessions will see the updated key." -ForegroundColor Yellow
Write-Host "Existing open PowerShell windows still have the old value." -ForegroundColor Yellow
Write-Host "Close all PowerShell windows and open a new one to use the key." -ForegroundColor Cyan`;
  } else {
    // Linux bash — writes the env file only, never touches ~/.bashrc or any
    // other shell startup file. You decide if/how to load it yourself.
    return `mkdir -p ~/.config/tinker-verse
printf 'export OPENROUTER_API_KEY="${key}"\\nexport OR_BASE_URL="https://openrouter.ai/api/v1"\\n' > ~/.config/tinker-verse/openrouter.env
chmod 600 ~/.config/tinker-verse/openrouter.env
source ~/.config/tinker-verse/openrouter.env
echo "OK key set: ${masked}"
echo "OK file: ~/.config/tinker-verse/openrouter.env"
echo ""
echo "NOTE: this only exported the key into the CURRENT shell session."
echo "Nothing was added to ~/.bashrc or any startup file — by design."
echo "To use it again later, run:"
echo "  source ~/.config/tinker-verse/openrouter.env"
echo "(or add that line to your own shell config yourself, if you want it automatic)"`;
  }
}
