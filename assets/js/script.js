/* MechRoute shared browser compatibility layer. */

function getApi() {
    return window.MechRouteAPI || null;
}

function generatePartnerEmail(fullName) {
    const parts = String(fullName || '')
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 0) {
        return '';
    }

    const firstName = parts[0].replace(/[^a-z0-9]/g, '');
    const lastName = (parts[parts.length - 1] || '').replace(/[^a-z0-9]/g, '');
    return `${firstName}${lastName ? `.${lastName}` : ''}.partner@mechroute.com`;
}

async function generateCredentials(event) {
    event.preventDefault();
    const gmailInput = document.getElementById('user-gmail');
    if (!gmailInput) return;

    const emailValue = gmailInput.value.trim();
    const prefix = emailValue.split('@')[0];
    const firstName = prefix.charAt(0).toUpperCase() + prefix.slice(1);

    localStorage.setItem('user_email', `${prefix}.mr@mechroute.com`);
    localStorage.setItem('user_firstName', firstName);
    window.location.href = 'account-setup.html';
}

function selectPartnerType(type) {
    localStorage.setItem('partner_type', type);
    const selected = document.getElementById(`${type}-card`);
    if (selected) {
        document.querySelectorAll('.type-card').forEach((card) => {
            card.style.borderColor = '#e2e8f0';
            card.style.background = 'white';
        });
        selected.style.borderColor = '#2563eb';
        selected.style.background = '#eff6ff';
    }
    setTimeout(() => {
        window.location.href = 'partner_register.html';
    }, 300);
}

async function handlePartnerRegistration(event) {
    event.preventDefault();
    const fullNameInput = document.getElementById('partnerName');
    const emailInput = document.getElementById('partnerEmail');
    const credentialInput = document.getElementById('credentialID');
    const passwordInput = document.getElementById('partnerPass');

    if (!fullNameInput || !emailInput || !credentialInput) return;

    const fullName = fullNameInput.value.trim();
    const email = generatePartnerEmail(fullName);
    const credentialId = credentialInput.value.trim();
    const password = passwordInput ? passwordInput.value : 'MECH2026';
    const partnerType = localStorage.getItem('partner_type') || 'Expert';
    const api = getApi();

    if (emailInput) {
        emailInput.value = email;
    }

    try {
        if (api) {
            const result = await api.registerPartner({
                fullName,
                email,
                password,
                credentialId,
                partnerType,
            });
            alert(`REGISTRATION SUCCESS!\nID: ${result.user.email}`);
            window.location.href = 'partner_dashboard.html';
            return;
        }

        const generatedID = email;
        const partnerData = { id: generatedID, pass: password, name: fullName, type: partnerType };
        localStorage.setItem('db_' + generatedID, JSON.stringify(partnerData));
        alert(`REGISTRATION SUCCESS!\nID: ${generatedID}\nPASS: ${password}`);
        window.location.href = 'partner_login.html';
    } catch (error) {
        alert(error.message);
    }
}

async function handlePartnerLogin(event) {
    event.preventDefault();
    const inputID = document.getElementById('partner-email');
    const inputPass = document.getElementById('partner-pass');
    if (!inputID || !inputPass) return;

    const email = inputID.value.trim();
    const password = inputPass.value;
    const api = getApi();

    try {
        if (api) {
            await api.loginPartner(email, password);
            window.location.href = 'partner_dashboard.html';
            return;
        }

        const savedData = localStorage.getItem('db_' + email);
        if (savedData) {
            const user = JSON.parse(savedData);
            if (user.pass === password) {
                localStorage.setItem('active_partner', JSON.stringify({
                    name: user.name,
                    email: user.id,
                    type: user.type,
                }));
                window.location.href = 'partner_dashboard.html';
            } else {
                alert('Invalid Password.');
            }
        } else {
            alert('Account not found.');
        }
    } catch (error) {
        alert(error.message);
    }
}

function generateServiceOTP() {
    const newOTP = Math.floor(1000 + Math.random() * 9000);
    localStorage.setItem('active_otp', newOTP);
    const status = JSON.parse(localStorage.getItem('active_job_status'));
    if (status) {
        status.status = 'awaiting_otp';
        localStorage.setItem('active_job_status', JSON.stringify(status));
        alert('OTP Generated! Driver can now see it on their dashboard.');
        location.reload();
    }
}

function verifyOTP() {
    const enteredOTP = document.getElementById('otpInput')?.value;
    const savedOTP = localStorage.getItem('active_otp');

    if (enteredOTP === savedOTP) {
        const status = JSON.parse(localStorage.getItem('active_job_status'));
        status.status = 'in_progress';
        localStorage.setItem('active_job_status', JSON.stringify(status));
        alert('Verified! Work started.');
        location.reload();
    } else {
        alert('Invalid OTP.');
    }
}

function completeWork() {
    const status = JSON.parse(localStorage.getItem('active_job_status'));
    status.status = 'awaiting_payment';
    localStorage.setItem('active_job_status', JSON.stringify(status));
    alert("Work marked as complete. Awaiting Driver's payment.");
    location.reload();
}

function cancelRequest() {
    if (confirm('Are you sure you want to cancel this service?')) {
        localStorage.setItem('job_cancelled_by_driver', 'true');
        localStorage.removeItem('fleet_logs');
        localStorage.removeItem('active_job_status');
        localStorage.removeItem('active_otp');
        alert('Request Cancelled.');
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

document.addEventListener('DOMContentLoaded', () => {
    const regForm = document.getElementById('regForm');
    if (regForm) regForm.addEventListener('submit', handlePartnerRegistration);

    const partnerNameInput = document.getElementById('partnerName');
    const partnerEmailInput = document.getElementById('partnerEmail');
    if (partnerNameInput && partnerEmailInput) {
        const syncPartnerEmail = () => {
            const generatedEmail = generatePartnerEmail(partnerNameInput.value);
            if (generatedEmail) {
                partnerEmailInput.value = generatedEmail;
            }
        };

        partnerNameInput.addEventListener('input', syncPartnerEmail);
        syncPartnerEmail();
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handlePartnerLogin);

    const userForm = document.getElementById('userForm');
    if (userForm) userForm.addEventListener('submit', generateCredentials);

    if (window.location.pathname.includes('partner_dashboard.html')) {
        startCancellationListener();
    }
});
