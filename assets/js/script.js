/* 🛠 MECHROUTE - CORE LOGIC ENGINE */

// --- 1. THE CONVERSION LOGIC (Gmail -> Pro ID) ---
function generateCredentials(event) {
    event.preventDefault();
    const gmailInput = document.getElementById('user-gmail').value;
    
    // Logic: Split "alex@gmail.com" to get "alex"
    const prefix = gmailInput.split('@')[0];
    
    // Create the professional MechRoute identity
    const generatedEmail = `${prefix}.mr@mechroute.com`;
    const tempPass = "START2026"; 

    // Save to Session Storage (Temporary Browser Memory)
    sessionStorage.setItem('mechEmail', generatedEmail);
    sessionStorage.setItem('mechPass', tempPass);
    
    // Redirect to the "Account Setup" page to reveal the new ID
    window.location.href = 'account-setup.html';
}

// --- 2. THE SECURITY CHECK (Login) ---
function handleLogin(event) {
    event.preventDefault();
    const inputEmail = document.getElementById('email').value;
    const inputPass = document.getElementById('password').value;

    // Retrieve the generated ID from memory
    const savedEmail = sessionStorage.getItem('mechEmail');
    const savedPass = sessionStorage.getItem('mechPass');

    // Check if user input matches what we generated
    // Also includes a master 'admin' account for testing
    if ((inputEmail === savedEmail && inputPass === savedPass) || 
        (inputEmail === "admin@mechroute.com" && inputPass === "service2026")) {
        window.location.href = "dashboard.html";
    } else {
        alert("Access Denied! Use your generated ID (e.g., name.mr@mechroute.com) and the password START2026.");
    }
}

// --- 3. THE MECHANIC SEARCH (Simulation) ---
function startMechanicSearch() {
    const resultsArea = document.getElementById('search-results');
    if (!resultsArea) return;

    // Show a loading spinner
    resultsArea.innerHTML = `
        <div class="card text-center" style="padding: 2rem;">
            <div class="loader" style="margin: 0 auto 1rem;"></div>
            <p>Locating nearest certified mechanics...</p>
        </div>`;

    // Simulate finding a mechanic after 2 seconds
    setTimeout(() => {
        resultsArea.innerHTML = `
            <div class="card" style="display:flex; justify-content:space-between; align-items:center; border-left: 5px solid var(--brand);">
                <div>
                    <h3 style="margin:0;">Elite Auto Care</h3>
                    <p style="margin:0; color:var(--text-muted);">⭐ 4.9 • 0.8 miles away</p>
                </div>
                <button class="btn btn-primary" onclick="window.location.href='payment.html?mode=tracking'">Request</button>
            </div>`;
    }, 2000);
}

// --- 4. THE LIVE TRACKING BAR ---
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // If we are on the payment page in "tracking mode"
    if (urlParams.get('mode') === 'tracking') {
        const progressBar = document.getElementById('progress-fill');
        let width = 0;
        
        // Move the progress bar automatically
        const interval = setInterval(() => {
            if (width >= 100) {
                clearInterval(interval);
                // Switch from tracking view to payment view
                document.getElementById('tracking-section').classList.add('hidden');
                document.getElementById('payment-section').classList.remove('hidden');
            } else {
                width++;
                if(progressBar) progressBar.style.width = width + '%';
            }
        }, 80); // Speed of the tracking simulation
    }
});
