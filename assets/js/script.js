/* 🛠 MECHROUTE - CORE LOGIC ENGINE */

// --- 1. DRIVER REGISTRATION ---
function generateCredentials(event) {
    event.preventDefault();
    const gmailInput = document.getElementById('user-gmail').value;
    const prefix = gmailInput.split('@')[0];
    localStorage.setItem('user_email', `${prefix}.mr@mechroute.com`);
    localStorage.setItem('user_firstName', prefix.charAt(0).toUpperCase() + prefix.slice(1));
    window.location.href = 'account-setup.html';
}

// --- 2. PARTNER FLOWS ---
function selectPartnerType(type) {
    localStorage.setItem('partner_type', type);
    const selected = document.getElementById(`${type}-card`);
    if(selected) { 
        document.querySelectorAll('.type-card').forEach(c => {
            c.style.borderColor = '#e2e8f0';
            c.style.background = 'white';
        });
        selected.style.borderColor = '#2563eb';
        selected.style.background = '#eff6ff';
    }
    setTimeout(() => { window.location.href = 'partner_register.html'; }, 300);
}

function handlePartnerRegistration(event) {
    event.preventDefault();
    const fullName = document.getElementById('partnerName').value;
    const role = localStorage.getItem('partner_type') || "Expert";
    const generatedID = `${fullName.split(' ')[0].toLowerCase()}.partner@mechroute.com`;
    const partnerData = { id: generatedID, pass: "MECH2026", name: fullName, type: role };
    localStorage.setItem('db_' + generatedID, JSON.stringify(partnerData));
    alert(`REGISTRATION SUCCESS!\nID: ${generatedID}\nPASS: MECH2026`);
    window.location.href = 'partner_login.html';
}

function handlePartnerLogin(event) {
    event.preventDefault();
    const inputID = document.getElementById('partner-email').value;
    const inputPass = document.getElementById('partner-pass').value;
    const savedData = localStorage.getItem('db_' + inputID);

    if (savedData) {
        const user = JSON.parse(savedData);
        if (user.pass === inputPass) {
            localStorage.setItem('active_partner', JSON.stringify({
                name: user.name,
                email: user.id,
                type: user.type
            }));
            window.location.href = 'partner_dashboard.html';
        } else { alert("Invalid Password."); }
    } else { alert("Account not found."); }
}

// --- 3. OTP ENGINE ---
function generateServiceOTP() {
    const newOTP = Math.floor(1000 + Math.random() * 9000);
    localStorage.setItem('active_otp', newOTP);
    const status = JSON.parse(localStorage.getItem('active_job_status'));
    if(status) {
        status.status = "awaiting_otp";
        localStorage.setItem('active_job_status', JSON.stringify(status));
        alert("OTP Generated! Driver can now see it on their dashboard.");
        location.reload(); 
    }
}

function verifyOTP() {
    const enteredOTP = document.getElementById('otpInput').value;
    const savedOTP = localStorage.getItem('active_otp');
    
    if (enteredOTP === savedOTP) {
        const status = JSON.parse(localStorage.getItem('active_job_status'));
        
        // Change status to 'in_progress' instead of deleting it
        status.status = "in_progress"; 
        localStorage.setItem('active_job_status', JSON.stringify(status));
        
        alert("Verified! Work started.");
        location.reload(); 
    } else { alert("Invalid OTP."); }
}

// Add this function for the Partner to click when they are DONE
function completeWork() {
    const status = JSON.parse(localStorage.getItem('active_job_status'));
    status.status = "awaiting_payment"; // Trigger for driver
    localStorage.setItem('active_job_status', JSON.stringify(status));
    alert("Work marked as complete. Awaiting Driver's payment.");
    location.reload();
}
// --- 4. CANCELLATION HANDSHAKE ---
function cancelRequest() {
    if(confirm("Are you sure you want to cancel this service?")) {
        localStorage.setItem('job_cancelled_by_driver', 'true');
        localStorage.removeItem('fleet_logs'); 
        localStorage.removeItem('active_job_status');
        localStorage.removeItem('active_otp');
        alert("Request Cancelled.");
        location.reload();
    }
}

function startCancellationListener() {
    setInterval(() => {
        if (localStorage.getItem('job_cancelled_by_driver') === 'true') {
            localStorage.removeItem('job_cancelled_by_driver');
            localStorage.removeItem('active_job_status');
            localStorage.removeItem('active_otp');
            alert("⚠️ ORDER CANCELLED: The driver has cancelled this request.");
            location.reload(); 
        }
    }, 2000);
}

// --- 5. INITIALIZER ---
document.addEventListener('DOMContentLoaded', () => {
    const regForm = document.getElementById('regForm');
    if (regForm) regForm.addEventListener('submit', handlePartnerRegistration);

    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handlePartnerLogin);

    const userForm = document.getElementById('userForm');
    if (userForm) userForm.addEventListener('submit', generateCredentials);

    if (window.location.pathname.includes('partner_dashboard.html')) {
        startCancellationListener();
    }
});
