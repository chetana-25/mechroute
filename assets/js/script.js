/* 🛠 MECHROUTE - CORE LOGIC ENGINE */

// --- 1. GMAIL TO PRO ID CONVERSION (For Users) ---
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

// --- 2. PARTNER SELECTION & REGISTRATION ---
function selectPartnerType(type) {
    localStorage.setItem('partner_type', type);
    
    const cards = document.querySelectorAll('.type-card');
    cards.forEach(card => {
        card.classList.remove('selected');
        card.style.borderColor = '#e2e8f0';
        card.style.background = 'white';
    });

    try {
        const selected = document.getElementById(`${type}-card`);
        if(selected) {
            selected.classList.add('selected');
            selected.style.borderColor = '#2563eb';
            selected.style.background = '#eff6ff';
        }
    } catch(e) { console.log("Card ID not found on this page."); }
}

// --- 3. PARTNER REGISTRATION (The "Once and Done" Logic) ---
function handlePartnerRegistration(event) {
    event.preventDefault(); 
    console.log("Partner Registration sequence triggered.");

    try {
        const fullName = document.getElementById('partnerName').value;
        const personalEmail = document.getElementById('partnerEmail').value;
        const type = localStorage.getItem('partner_type') || "expert";
        const credID = document.getElementById('credentialID').value;

        // GENERATE EASY CREDENTIALS
        const firstName = fullName.split(' ')[0].toLowerCase(); 
        const generatedID = `${firstName}.partner@mechroute.com`;
        const defaultPass = "MECH2026"; 

        const partnerData = {
            name: fullName,
            contactEmail: personalEmail,
            workID: generatedID,
            password: defaultPass,
            role: type,
            credentialID: credID,
            regDate: new Date().toLocaleDateString()
        };

        // SAVE TO LOCAL DATABASE
        localStorage.setItem('db_' + generatedID, JSON.stringify(partnerData));
        
        alert(
            "REGISTRATION SUCCESSFUL!\n\n" +
            "Your Partner ID: " + generatedID + "\n" +
            "Your Password: " + defaultPass + "\n\n" +
            "Click OK to go to the Login Page."
        );

        window.location.href = 'partner_login.html';

    } catch (error) {
        console.error("Critical Reg Error:", error);
        alert("System Error: Please ensure all fields are filled.");
    }
}

// --- 4. PARTNER LOGIN SECURITY ---
function handlePartnerLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('partner-email').value;
    const pass = document.getElementById('partner-pass').value;

    const savedUser = localStorage.getItem('db_' + email);

    if (savedUser) {
        const user = JSON.parse(savedUser);
        if (user.password === pass) {
            localStorage.setItem('current_partner_session', JSON.stringify(user));
            window.location.href = 'partner_dashboard.html';
        } else {
            alert("Invalid Password! Please use: MECH2026");
        }
    } else {
        alert("Partner ID not found. Please register first.");
    }
}

// --- 5. THE REFRESH PROTECTOR & INITIALIZATION ---
// This section ensures the buttons actually trigger the functions above
document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on the Register Page
    const regForm = document.getElementById('regForm');
    if (regForm) {
        regForm.addEventListener('submit', handlePartnerRegistration);
    }

    // Check if we are on the Login Page
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handlePartnerLogin);
    }

    // --- Dynamic Pricing & Progress Logic ---
    const urlParams = new URLSearchParams(window.location.search);
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

    if (urlParams.get('mode') === 'tracking') {
        const progressBar = document.getElementById('progress-fill');
        let width = 0;
        const interval = setInterval(() => {
            if (width >= 100) {
                clearInterval(interval);
                document.getElementById('tracking-section')?.classList.add('hidden');
                document.getElementById('payment-section')?.classList.remove('hidden');
            } else {
                width++;
                if(progressBar) progressBar.style.width = width + '%';
            }
        }, 50);
    }
});
