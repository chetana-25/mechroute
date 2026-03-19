/* MECHROUTE - CORE ENGINE */

// --- 1. REGISTRATION & ID GENERATION ---
function generateCredentials(event) {
    event.preventDefault();
    const gmailInput = document.getElementById('user-gmail').value;
    
    // THE FIX: Convert "name@gmail.com" to "name.mr@mechroute.com"
    const prefix = gmailInput.split('@')[0];
    const generatedEmail = `${prefix}.mr@mechroute.com`;
    const tempPass = "START2026"; 

    // Store in browser memory for the Login page to verify
    sessionStorage.setItem('mechEmail', generatedEmail);
    sessionStorage.setItem('mechPass', tempPass);
    
    // Redirect to the reveal page
    window.location.href = 'account-setup.html';
}

// --- 2. LOGIN VALIDATION ---
function handleLogin(event) {
    event.preventDefault();
    const inputEmail = document.getElementById('email').value;
    const inputPass = document.getElementById('password').value;

    // Check against the generated ID in memory
    const savedEmail = sessionStorage.getItem('mechEmail');
    const savedPass = sessionStorage.getItem('mechPass');

    // Default admin fallback for testing
    if ((inputEmail === savedEmail && inputPass === savedPass) || 
        (inputEmail === "admin@mechroute.com" && inputPass === "service2026")) {
        window.location.href = "dashboard.html";
    } else {
        alert("Access Denied! Please use your generated MechRoute ID (e.g. name.mr@mechroute.com) and the password START2026.");
    }
}

// --- 3. SEARCH & TRACKING SIMULATION ---
function startMechanicSearch() {
    const resultsArea = document.getElementById('search-results');
    if (!resultsArea) return;

    resultsArea.innerHTML = `<div class="card text-center"><div class="loader"></div><p>Scanning GPS for Mechanics...</p></div>`;

    setTimeout(() => {
        resultsArea.innerHTML = `
            <div class="card" style="display:flex; justify-content:space-between; align-items:center; border-left: 5px solid var(--brand);">
                <div><h3>Elite Auto Care</h3><p>⭐ 4.9 • 0.5 miles away</p></div>
                <button class="btn btn-primary" onclick="window.location.href='payment.html?mode=tracking'">Request Now</button>
            </div>`;
    }, 2000);
}

// --- 4. LIVE TRACKING BAR LOGIC ---
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'tracking') {
        const progressBar = document.getElementById('progress-fill');
        let width = 0;
        const interval = setInterval(() => {
            if (width >= 100) {
                clearInterval(interval);
                document.getElementById('tracking-section').classList.add('hidden');
                document.getElementById('payment-section').classList.remove('hidden');
            } else {
                width++;
                if(progressBar) progressBar.style.width = width + '%';
            }
        }, 50);
    }
});
