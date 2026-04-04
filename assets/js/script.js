/* 🛠 MECHROUTE - CORE LOGIC ENGINE */

// --- 1. GMAIL TO PRO ID CONVERSION ---
function generateCredentials(event) {
    event.preventDefault();
    const gmailInput = document.getElementById('user-gmail').value;
    const prefix = gmailInput.split('@')[0];
    
    const generatedEmail = `${prefix}.mr@mechroute.com`;
    const tempPass = "START2026"; 

    localStorage.setItem('mechEmail', generatedEmail);
    localStorage.setItem('mechPass', tempPass);
    localStorage.setItem('user_firstName', prefix.charAt(0).toUpperCase() + prefix.slice(1));
    
    window.location.href = 'account-setup.html';
}

// --- 2. LOGIN SECURITY ---
function handleLogin(event) {
    event.preventDefault();
    const inputEmail = document.getElementById('email').value;
    const inputPass = document.getElementById('password').value;

    const savedEmail = localStorage.getItem('mechEmail');
    const savedPass = localStorage.getItem('mechPass');

    if ((inputEmail === savedEmail && inputPass === savedPass) || 
        (inputEmail === "admin@mechroute.com" && inputPass === "service2026")) {
        window.location.href = "dashboard.html";
    } else {
        alert("Access Denied! Use your generated ID and the password START2026.");
    }
}

// --- 3. DYNAMIC PRICING & TRACKING (Runs on page load) ---
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Update Payment Page with real Booking Data
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

    // Progress Bar Simulation
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

// --- 4. PARTNER SELECTION & REGISTRATION ---
function selectPartnerType(type) {
    localStorage.setItem('partner_type', type);
    
    // Visual Highlight
    const cards = document.querySelectorAll('.type-card');
    cards.forEach(card => {
        card.style.borderColor = 'transparent';
        card.style.background = 'white';
    });

    // We use a try/catch in case IDs aren't on the specific page
    try {
        const selected = document.getElementById(`${type}-card`);
        if(selected) {
            selected.style.borderColor = '#2563eb';
            selected.style.background = '#f8fafc';
        }
    } catch(e) {}
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
