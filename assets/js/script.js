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
/* 🛠 MECHROUTE - PARTNER ENGINE */

function handlePartnerRegistration(event) {
    // 1. Prevent the page from refreshing/clearing
    event.preventDefault();

    // 2. Get the values from your form fields
    const fullName = document.getElementById('partnerName').value;
    const personalEmail = document.getElementById('partnerEmail').value;
    const role = localStorage.getItem('partner_type') || "Partner";

    // 3. Generate "Easy to Remember" Credentials
    // Example: "Drive Mechanics" -> "drive.partner@mechroute.com"
    const prefix = fullName.split(' ')[0].toLowerCase();
    const generatedID = `${prefix}.partner@mechroute.com`;
    const defaultPass = "MECH2026"; 

    // 4. Save to LocalStorage so the Login page can find it later
    const partnerData = {
        id: generatedID,
        pass: defaultPass,
        name: fullName,
        type: role
    };
    localStorage.setItem('db_' + generatedID, JSON.stringify(partnerData));

    // 5. THE KEY STEP: Show credentials in an alert
    // The code WILL NOT redirect until the user clicks OK.
    alert(
        "REGISTRATION SUCCESSFUL!\n\n" +
        "Please remember your Login details:\n" +
        "PARTNER ID: " + generatedID + "\n" +
        "PASSWORD: " + defaultPass + "\n\n" +
        "Click OK to proceed to the Login Page."
    );

    // 6. Redirect to your Login Page (image 3)
    window.location.href = 'partner_login.html';
}

// --- LOGIN LOGIC ---
function handlePartnerLogin(event) {
    event.preventDefault();
    const inputID = document.getElementById('partner-email').value;
    const inputPass = document.getElementById('partner-pass').value;

    const savedData = localStorage.getItem('db_' + inputID);

    if (savedData) {
        const user = JSON.parse(savedData);
        if (user.pass === inputPass) {
            window.location.href = 'partner_dashboard.html';
        } else {
            alert("Invalid Password. Please use MECH2026.");
        }
    } else {
        alert("Account not found. Please register first.");
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
