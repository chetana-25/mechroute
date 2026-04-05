/* 🛠 MECHROUTE - CORE LOGIC ENGINE */

// --- 1. USER GMAIL TO PRO ID ---
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

// --- 2. PARTNER SELECTION ---
function selectPartnerType(type) {
    localStorage.setItem('partner_type', type);
    
    // UI Feedback for cards
    const cards = document.querySelectorAll('.type-card');
    cards.forEach(card => {
        card.style.borderColor = '#e2e8f0';
        card.style.background = 'white';
    });

    const selected = document.getElementById(`${type}-card`);
    if(selected) {
        selected.style.borderColor = '#2563eb';
        selected.style.background = '#eff6ff';
    }
    
    // Redirect to registration after selection
    setTimeout(() => {
        window.location.href = 'partner_register.html';
    }, 300);
}

// --- 3. PARTNER REGISTRATION ---
function handlePartnerRegistration(event) {
    event.preventDefault(); // STOPS REFRESH

    const fullName = document.getElementById('partnerName').value;
    const role = localStorage.getItem('partner_type') || "Partner";

    // Generate ID
    const prefix = fullName.split(' ')[0].toLowerCase();
    const generatedID = `${prefix}.partner@mechroute.com`;
    const defaultPass = "MECH2026"; 

    // Save to Data
    const partnerData = {
        id: generatedID,
        pass: defaultPass,
        name: fullName,
        type: role
    };
    localStorage.setItem('db_' + generatedID, JSON.stringify(partnerData));

    alert(
        "REGISTRATION SUCCESSFUL!\n\n" +
        "PARTNER ID: " + generatedID + "\n" +
        "PASSWORD: " + defaultPass + "\n\n" +
        "Click OK to Login."
    );

    window.location.href = 'partner_login.html';
}

// --- 4. LOGIN LOGIC ---
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
            alert("Invalid Password. Use: MECH2026");
        }
    } else {
        alert("Account not found. Please register first.");
    }
}

// --- 5. THE INITIALIZER (The "Glue") ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Hook the Register Form
    const regForm = document.getElementById('regForm');
    if (regForm) {
        regForm.addEventListener('submit', handlePartnerRegistration);
    }

    // 2. Hook the Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handlePartnerLogin);
    }

    // 3. Hook User Credential Form
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', generateCredentials);
    }
});
