/**
 * MechRoute - Frontend Logic & Simulations
 * This script handles UI interactions and simulates backend processes.
 */

// 1. MECHANIC SEARCH SIMULATION
// Used in service.html to show how matching works
function startMechanicSearch() {
    const resultsArea = document.getElementById('search-results');
    if (!resultsArea) return;

    // Show a "Loading" state
    resultsArea.innerHTML = `
        <div class="card text-center">
            <div class="loader-spinner"></div>
            <p style="margin-top: 1rem; color: var(--text-muted);">
                Scanning your GPS coordinates...
            </p>
        </div>
    `;

    // Simulate a 2-second delay as if talking to a server
    setTimeout(() => {
        resultsArea.innerHTML = `
            <div class="card" style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <span class="badge badge-success">Top Rated</span>
                    <h3 style="margin-top: 0.5rem;">Professional Auto Rescue</h3>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">
                        📍 0.8 miles away • ⭐ 4.9 (120 reviews)
                    </p>
                </div>
                <button class="btn btn-primary" onclick="requestMechanic()">Accept & Request</button>
            </div>
            
            <div class="card" style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h3 style="margin-top: 0.5rem;">QuickFix Mobile Mechanic</h3>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">
                        📍 1.5 miles away • ⭐ 4.7 (85 reviews)
                    </p>
                </div>
                <button class="btn btn-primary" onclick="requestMechanic()">Accept & Request</button>
            </div>
        `;
    }, 2000);
}

// 2. REQUEST REDIRECTION
function requestMechanic() {
    // Redirect to the payment/tracking page with a "live" flag in the URL
    window.location.href = 'payment.html?mode=tracking';
}

// 3. TRACKING & PROGRESS SIMULATION
// This runs automatically when payment.html loads
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check if we are in "tracking mode"
    if (urlParams.get('mode') === 'tracking') {
        const trackingSection = document.getElementById('tracking-section');
        const paymentSection = document.getElementById('payment-section');
        const progressBar = document.getElementById('progress-fill');
        const statusUpdate = document.getElementById('status-update');

        if (!trackingSection) return;

        // Start the progress simulation
        let progress = 0;
        const interval = setInterval(() => {
            progress += 1; // Increment by 1%
            
            if (progressBar) progressBar.style.width = progress + '%';

            // Change messages based on progress
            if (progress === 20) statusUpdate.innerText = "Mechanic has accepted your request...";
            if (progress === 50) statusUpdate.innerText = "Mechanic is navigating to your location...";
            if (progress === 85) statusUpdate.innerText = "Mechanic is just around the corner!";

            if (progress >= 100) {
                clearInterval(interval);
                statusUpdate.innerText = "Mechanic Arrived!";
                
                // Switch from Tracking UI to Payment UI after a short pause
                setTimeout(() => {
                    trackingSection.classList.add('hidden');
                    paymentSection.classList.remove('hidden');
                }, 1500);
            }
        }, 50); // Speed of the bar (lower is faster)
    }
});

// 4. BOOKING SUCCESS
function confirmBooking(event) {
    event.preventDefault();
    alert("Service Scheduled Successfully! You can view it in your History.");
    window.location.href = 'dashboard.html';
}

// 5. FINAL PAYMENT
function processPayment() {
    const btn = document.querySelector('.btn-pay');
    if (btn) btn.innerText = "Processing...";
    
    setTimeout(() => {
        alert("Payment Successful! $45.00 has been charged.");
        window.location.href = 'dashboard.html';
    }, 1500);
}
