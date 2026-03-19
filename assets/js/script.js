/* MECHROUTE - CORE ENGINE */

// --- 1. REGISTRATION & ID GENERATION ---
function generateCredentials(event) {
    event.preventDefault();
    const gmailInput = document.getElementById('user-gmail').value;
    
    // Logic: Create a Pro ID from their Gmail name
    const prefix = gmailInput.split('@')[0];
    const generatedEmail = `${prefix}.mr@mechroute.com`;
    const tempPass = "START2026"; // Default temporary password

    // Store in browser memory so Login page can "see" it
    sessionStorage.setItem('mechEmail', generatedEmail);
    sessionStorage.setItem('mechPass', tempPass);
    
    // Move to the Setup page to show the user their new ID
    window.location.href = 'account-setup.html';
}

// --- 2. LOGIN VALIDATION ---
function handleLogin(event) {
    event.preventDefault();
    const inputEmail = document.getElementById('email').value;
    const inputPass = document.getElementById('password').value;

    // Retrieve what was generated, or use default admin for testing
    const savedEmail = sessionStorage.getItem('mechEmail') || "admin@mechroute.com";
    const savedPass = sessionStorage.getItem('mechPass') || "service2026";

    if (inputEmail === savedEmail && inputPass === savedPass) {
        window.location.href = "dashboard.html";
    } else {
        alert("Access Denied! Use your generated MechRoute ID and Password.");
    }
}

// --- 3. SEARCH & TRACKING SIMULATION ---
function startMechanicSearch() {
    const resultsArea = document.getElementById('search-results');
    if (!resultsArea) return;

    resultsArea.innerHTML = `<div class="card text-center"><div class="loader"></div><p>Scanning GPS...</p></div>`;

    setTimeout(() => {
        resultsArea.innerHTML = `
            <div class="card" style="display:flex; justify-content:space-between; align-items:center;">
                <div><h3>Elite Auto Care</h3><p>⭐ 4.9 • 0.5 miles away</p></div>
                <button class="btn btn-primary" onclick="window.location.href='payment.html?mode=tracking'">Request</button>
            </div>`;
    }, 2000);
}

// --- 4. LIVE TRACKING BAR ---
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
