/* 🛠 MECHROUTE - CORE LOGIC ENGINE (Updated) */

// --- 1. THE CONVERSION LOGIC (Gmail -> Pro ID) ---
function generateCredentials(event) {
    event.preventDefault();
    const gmailInput = document.getElementById('user-gmail').value;
    const firstName = gmailInput.split('@')[0];
    
    // Create the professional MechRoute identity
    const generatedEmail = `${firstName}.mr@mechroute.com`;
    const tempPass = "START2026"; 

    // Save to Local Storage (Better than Session for persistent logins)
    localStorage.setItem('user_firstName', firstName.charAt(0).toUpperCase() + firstName.slice(1));
    localStorage.setItem('user_email', generatedEmail);
    localStorage.setItem('user_pass', tempPass);
    
    window.location.href = 'account-setup.html';
}

// --- 2. THE SECURITY CHECK (Login) ---
function handleLogin(event) {
    event.preventDefault();
    const inputEmail = document.getElementById('email').value;
    const inputPass = document.getElementById('password').value;

    const savedEmail = localStorage.getItem('user_email');
    const savedPass = localStorage.getItem('user_pass');

    if ((inputEmail === savedEmail && inputPass === savedPass) || 
        (inputEmail === "admin@mechroute.com" && inputPass === "service2026")) {
        window.location.href = "dashboard.html";
    } else {
        alert("Access Denied! Check your credentials.");
    }
}

// --- 3. THE MECHANIC SEARCH (Simulation) ---
function startMechanicSearch() {
    const resultsArea = document.getElementById('search-results');
    if (!resultsArea) return;

    resultsArea.innerHTML = `
        <div class="card text-center" style="padding: 2rem;">
            <div class="loader" style="margin: 0 auto 1rem;"></div>
            <p>Locating nearest certified mechanics...</p>
        </div>`;

    setTimeout(() => {
        resultsArea.innerHTML = `
            <div class="card" style="display:flex; justify-content:space-between; align-items:center; border-left: 5px solid var(--brand-blue);">
                <div>
                    <h3 style="margin:0;">Elite Auto Care</h3>
                    <p style="margin:0; color:var(--soft-slate);">⭐ 4.9 • 0.8 miles away</p>
                </div>
                <button class="btn-pay" style="width:auto; padding:10px 20px;" onclick="window.location.href='payment.html?mode=tracking'">Request</button>
            </div>`;
    }, 2000);
}

// --- 4. THE LIVE TRACKING & DYNAMIC PRICING ---
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Logic for Payment Page: Fetch real price from logs
    const displayPrice = document.getElementById('displayPrice');
    if (displayPrice) {
        const logs = JSON.parse(localStorage.getItem('fleet_logs')) || [];
        if (logs.length > 0) {
            const latest = logs[logs.length - 1];
            displayPrice.innerText = latest.price;
            if(document.getElementById('serviceName')) {
                document.getElementById('serviceName').innerText = latest.service;
            }
        }
    }

    // Logic for Live Progress Bar
    if (urlParams.get('mode') === 'tracking') {
        const progressBar = document.getElementById('progress-fill');
        let width = 0;
        
        const interval = setInterval(() => {
            if (width >= 100) {
                clearInterval(interval);
                const trackSec = document.getElementById('tracking-section');
                const paySec = document.getElementById('payment-section');
                if(trackSec) trackSec.classList.add('hidden');
                if(paySec) paySec.classList.remove('hidden');
            } else {
                width++;
                if(progressBar) progressBar.style.width = width + '%';
            }
        }, 50); 
    }
});

// --- 5. PARTNER TERMINAL LOGIC ---
function selectPartnerType(type) {
    localStorage.setItem('partner_type', type);
    // Visual feedback
    const cards = document.querySelectorAll('.type-card');
    cards.forEach(c => c.style.borderColor = 'transparent');
    event.currentTarget.style.borderColor = '#2563eb';
}

function handlePartnerRegistration(event) {
    event.preventDefault();
    const partnerData = {
        name: document.getElementById('partnerName').value,
        email: document.getElementById('partnerEmail').value,
        type: localStorage.getItem('partner_type'),
        id: document.getElementById('credentialID').value
    };
    localStorage.setItem('active_partner', JSON.stringify(partnerData));
    window.location.href = 'partner_dashboard.html';
}
