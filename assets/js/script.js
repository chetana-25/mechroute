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

// 1. REGISTRATION: Generates ID and Default Password
function handlePartnerRegistration(event) {
    event.preventDefault();

    const fullName = document.getElementById('partnerName').value;
    const personalEmail = document.getElementById('partnerEmail').value;
    const type = localStorage.getItem('partner_type');
    const credID = document.getElementById('credentialID').value;

    // GENERATE CREDENTIALS
    // We take the first name and add .partner@mechroute.com
    const cleanName = fullName.split(' ')[0].toLowerCase(); 
    const generatedID = `${cleanName}.partner@mechroute.com`;
    const defaultPass = "MECH2026"; // The password we give everyone to start

    const partnerData = {
        name: fullName,
        workID: generatedID,
        password: defaultPass,
        role: type,
        status: 'Active'
    };

    // STORE DATA (Using the generated email as the key)
    localStorage.setItem('db_' + generatedID, JSON.stringify(partnerData));
    
    // Alert the user of their NEW credentials
    alert(`REGISTRATION SUCCESSFUL!\n\nYour Login ID: ${generatedID}\nYour Password: ${defaultPass}\n\nPlease save these to sign in.`);

    // Move to Login Page
    window.location.href = 'partner_login.html';
}

// 2. LOGIN: Checks if they exist in our "Database"
function handlePartnerLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('partner-email').value;
    const pass = document.getElementById('partner-pass').value;

    // Try to find them in localStorage
    const savedUser = localStorage.getItem('db_' + email);

    if (savedUser) {
        const user = JSON.parse(savedUser);
        if (user.password === pass) {
            // Success! Save session and go to dashboard
            localStorage.setItem('current_partner_session', JSON.stringify(user));
            window.location.href = 'partner_dashboard.html';
        } else {
            alert("Invalid Password. Please use the one provided (MECH2026).");
        }
    } else {
        alert("Account not found. Please register as a partner first.");
    }
}
