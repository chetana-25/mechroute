/* 🛠 MECHROUTE - CORE LOGIC ENGINE */

// --- 1. USER GMAIL TO PRO ID (For Driver Registration) ---
function generateCredentials(event) {
    event.preventDefault();
    const gmailInput = document.getElementById('user-gmail').value;
    const prefix = gmailInput.split('@')[0];
    
    const generatedEmail = `${prefix}.mr@mechroute.com`;
    const tempPass = "START2026"; 

    localStorage.setItem('user_email', generatedEmail); // Changed to match dashboard key
    localStorage.setItem('mechPass', tempPass);
    localStorage.setItem('user_firstName', prefix.charAt(0).toUpperCase() + prefix.slice(1));
    
    window.location.href = 'account-setup.html';
}

// --- 2. THE BRIDGE: PARTNER ACCEPTS JOB ---
function acceptJob() {
    // This creates the "Message" for the Driver's Dashboard
    const notification = {
        status: "accepted",
        partnerName: "Drive Mechanics Workshop", 
        time: new Date().toLocaleTimeString(),
        message: "A certified technician has accepted your request and is en route."
    };

    // We use 'active_job_status' so the pages/dashboard.html can find it
    localStorage.setItem('active_job_status', JSON.stringify(notification));

    alert("SUCCESS: Driver has been notified via their Fleet Command dashboard!");
    
    // Optional: Refresh the partner page to show 'In Progress' status
    location.reload();
}

// --- 3. PARTNER SELECTION LOGIC ---
function selectPartnerType(type) {
    localStorage.setItem('partner_type', type);
    
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
    
    setTimeout(() => {
        window.location.href = 'partner_register.html';
    }, 300);
}
// --- 7. OTP & PAYMENT FLOW ---

function generateServiceOTP() {
    // 1. Generate a random 4-digit number
    const newOTP = Math.floor(1000 + Math.random() * 9000);
    
    // 2. Save it to the shared 'Post Office'
    localStorage.setItem('active_otp', newOTP);
    
    // 3. Update the job status so the driver knows to look for the OTP
    const status = JSON.parse(localStorage.getItem('active_job_status'));
    status.status = "awaiting_otp";
    localStorage.setItem('active_job_status', JSON.stringify(status));

    alert("OTP Generated! Ask the driver for the code shown on their dashboard.");
}

function verifyOTP() {
    const enteredOTP = document.getElementById('otpInput').value;
    const savedOTP = localStorage.getItem('active_otp');

    if (enteredOTP === savedOTP) {
        // Success! Update status to 'completed'
        const status = JSON.parse(localStorage.getItem('active_job_status'));
        status.status = "completed";
        localStorage.setItem('active_job_status', JSON.stringify(status));
        
        alert("Verification Successful! Payment portal is now open for the driver.");
        location.reload(); // Refresh to show success
    } else {
        alert("Invalid OTP. Please try again.");
    }
}
// --- 4. PARTNER REGISTRATION ---
function handlePartnerRegistration(event) {
    event.preventDefault(); 

    const fullName = document.getElementById('partnerName').value;
    const role = localStorage.getItem('partner_type') || "Partner";

    const prefix = fullName.split(' ')[0].toLowerCase();
    const generatedID = `${prefix}.partner@mechroute.com`;
    const defaultPass = "MECH2026"; 

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
        "PASSWORD: " + defaultPass
    );

    window.location.href = 'partner_login.html';
}

// --- 5. PARTNER LOGIN ---
function handlePartnerLogin(event) {
    event.preventDefault();
    const inputID = document.getElementById('partner-email').value;
    const inputPass = document.getElementById('partner-pass').value;

    const savedData = localStorage.getItem('db_' + inputID);

    if (savedData) {
        const user = JSON.parse(savedData);
        if (user.pass === inputPass) {
            // WE SAVE THE WHOLE USER OBJECT (including the Name!)
            localStorage.setItem('active_partner', JSON.stringify({
                name: user.name,  // This is the Company or Individual name
                email: user.id,
                type: user.type
            }));
            window.location.href = 'partner_dashboard.html';
        } else {
            alert("Invalid Password.");
        }
    } else {
        alert("Account not found.");
    }
}

// --- 6. THE INITIALIZER (The "Glue") ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. PULL DATA FROM STORAGE
    // This looks for the 'db_email' we saved during registration
    // Or the 'active_partner' session from the login page
    const sessionData = JSON.parse(localStorage.getItem('active_partner'));

    if (sessionData) {
        // DISPLAY THE COMPANY OR INDIVIDUAL NAME
        document.getElementById('partnerNameDisplay').innerText = `Welcome, ${sessionData.name}`;
        
        // DISPLAY THE EMAIL
        document.getElementById('partnerEmailDisplay').innerText = sessionData.email;
        
        // UPDATE THE BADGE (Individual Technician vs Service Company)
        const badge = document.getElementById('typeBadge');
        badge.innerText = sessionData.type || "Expert Partner";
        
        // Visual touch: Change badge color if it's a Company
        if(sessionData.type === 'company' || sessionData.type === 'Workshop') {
            badge.style.background = '#059669'; // Emerald Green for Companies
        }
    } else {
        // If someone reaches this page without logging in
        document.getElementById('partnerNameDisplay').innerText = "Welcome, MechRoute Partner";
    }

    // ... rest of your Job Loading logic ...
    const currentJob = localStorage.getItem('active_job_status');
    if (currentJob) {
        showServiceTerminal(JSON.parse(currentJob));
    } else {
        loadAvailableJobs();
    }
});
