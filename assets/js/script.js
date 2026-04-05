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
        alert("OTP Generated! Code is now visible on Driver's Dashboard.");
    }
}

function verifyOTP() {
    const enteredOTP = document.getElementById('otpInput').value;
    const savedOTP = localStorage.getItem('active_otp');
    if (enteredOTP === savedOTP) {
        const status = JSON.parse(localStorage.getItem('active_job_status'));
        status.status = "completed";
        localStorage.setItem('active_job_status', JSON.stringify(status));
        alert("Verified! Service Complete.");
        
        // Cleanup
        localStorage.removeItem('active_job_status');
        localStorage.removeItem('active_otp');
        location.reload();
    } else { alert("Invalid OTP."); }
}

// --- 4. CANCELLATION LOGIC ---

function cancelRequest() {
    if(confirm("Are you sure you want to cancel this service?")) {
        // 1. Signal to Partner
        localStorage.setItem('job_cancelled_by_driver', 'true');
        
        // 2. Clear Fleet Logs (so the job disappears from the 'Live' list)
        localStorage.removeItem('fleet_logs'); 
        
        // 3. Clear active status
        localStorage.removeItem('active_job_status');
        localStorage.removeItem('active_otp');
        
        alert("Request Cancelled. Returning to Dashboard.");
        location.reload();
    }
}

// This function runs only on the Partner Dashboard to listen for cancellations
function startCancellationListener() {
    setInterval(() => {
        if (localStorage.getItem('job_cancelled_by_driver') === 'true') {
            localStorage.removeItem('job_cancelled_by_driver');
            localStorage.removeItem('active_job_status');
            localStorage.removeItem('active_otp');
            
            alert("⚠️ NOTICE: The driver has cancelled this service request.");
            location.reload(); // Returns partner to the job list
        }
    }, 2000);
}

// --- 5. THE INITIALIZER ---
document.addEventListener('DOMContentLoaded', () => {
    const regForm = document.getElementById('regForm');
    if (regForm) regForm.addEventListener('submit', handlePartnerRegistration);

    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handlePartnerLogin);

    const userForm = document.getElementById('userForm');
    if (userForm) userForm.addEventListener('submit', generateCredentials);

    // If we are on the Partner Dashboard, start listening for cancellations
    if (window.location.pathname.includes('partner_dashboard.html')) {
        startCancellationListener();
    }
});
