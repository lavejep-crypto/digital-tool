// ====== AUTH SYSTEM ======

// Save user to localStorage
function saveUsers() {
  localStorage.setItem("users", JSON.stringify(users));
}

// Load users from localStorage (if any)
function loadUsers() {
  const saved = localStorage.getItem("users");
  if (saved) {
    users = JSON.parse(saved);
  }
}
loadUsers();

document.getElementById('guestForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Stop the page from reloading (CRITICAL for a static app)
    
    // 1. Get current form values
    const guestName = document.getElementById('name').value.trim();
    const idPassport = document.getElementById('id_passport').value.trim();
    const checkInTime = document.getElementById('check_in').value;
    const unit = document.getElementById('unit').value.trim();

    if (!guestName || !idPassport || !checkInTime || !unit) {
        alert("All fields are required for compliance.");
        return;
    }

    // 2. Create the new log entry object
    const newEntry = {
        name: guestName,
        id: idPassport,
        checkIn: checkInTime,
        unit: unit,
        logTime: new Date().toISOString() // Time entry was logged (for audit)
    };

    // 3. Load existing logs from Local Storage
    let logs = localStorage.getItem('guestLogs');
    logs = logs ? JSON.parse(logs) : []; // Parse JSON or start a new empty array

    // 4. Add the new entry and save back to Local Storage
    logs.push(newEntry);
    localStorage.setItem('guestLogs', JSON.stringify(logs));

    // 5. Confirmation and Cleanup
    alert("SUCCESS! Guest " + guestName + " logged for unit " + unit + ". Log saved locally.");
    e.target.reset(); // Clear the form for the next check-in
});

function exportLogToCSV() {
    // 1. Get the data from Local Storage
    let logs = localStorage.getItem('guestLogs');
    logs = logs ? JSON.parse(logs) : [];

    if (logs.length === 0) {
        alert("The log is empty. No data to export.");
        return;
    }

    // 2. Define the CSV Headers (Mandatory for compliance)
    const headers = ['Name', 'ID_Passport', 'Unit', 'Check_In_Time', 'Logged_Time'];

    // 3. Format the data rows
    const csvRows = [];
    csvRows.push(headers.join(',')); // Add the headers row

    for (const entry of logs) {
        // Prepare each field for CSV format, ensuring no commas break the structure
        const values = [
            `"${entry.name.replace(/"/g, '""')}"`, // Quote fields that might contain commas
            `"${entry.id.replace(/"/g, '""')}"`,
            `"${entry.unit.replace(/"/g, '""')}"`,
            entry.checkIn, // ISO format time is good
            entry.logTime
        ];
        csvRows.push(values.join(','));
    }

    // 4. Create the CSV Blob and Download Link
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    // Set filename to include the date for easy audit tracking
    const today = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `ComplianceLog_Eldoret_${today}.csv`);
    
    // 5. Trigger the download and clean up
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert(`SUCCESS! Exported ${logs.length} entries. File: ComplianceLog_Eldoret_${today}.csv`);
}

// Attach the function to the button click event
document.getElementById('exportCsvButton').addEventListener('click', exportLogToCSV);

// A simple, hardcoded password check for UX ONLY. NOT for real security.
const MANAGER_PASSWORD = "EldoretAudit25"; // **CHANGE THIS BEFORE PITCHING**
const MAX_ATTEMPTS = 3;
let attemptCount = 0;

function passwordProtectExport() {
    const password = prompt("Manager: Enter Audit Export Password:");

    if (password === MANAGER_PASSWORD) {
        attemptCount = 0; // Reset counter on success
        exportLogToCSV();
    } else {
        attemptCount++;
        if (attemptCount >= MAX_ATTEMPTS) {
            // Lockout logic (display for specific staff)
            document.getElementById('exportCsvButton').style.display = 'none';
            // Simple display staff name logic using the staff's phone name/model
            const staffDevice = navigator.userAgent.substring(0, 30); 
            showToast('ERROR', `Audit Access Locked. Too many failed attempts on device: ${staffDevice}. Contact Admin.`, 'error');
            setTimeout(() => { attemptCount = 0; }, 60000); // Lockout for 60 seconds
        } else {
            showToast('ERROR', `Invalid Password. Attempts remaining: ${MAX_ATTEMPTS - attemptCount}.`, 'error');
        }
    }
}

// Re-assign the button click to this new function
document.getElementById('exportCsvButton').addEventListener('click', passwordProtectExport);

// Function to play sound (requires a success.mp3 file in the root folder)
function playSuccessSound() {
    try {
        const audio = new Audio('success.mp3');
        audio.play().catch(e => console.error("Audio play failed:", e)); 
    } catch (e) {
        console.error("Audio API not supported.");
    }
}

// Function to display the high-impact toast
function showToast(title, message, type) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    // Use the type to change color (e.g., 'success', 'error')
    toast.className = `toast ${type}`; 
    toast.innerHTML = `<strong>${title}</strong>: ${message}`;
    
    container.appendChild(toast);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        toast.remove();
    }, 4000);

    // Play sound only for successful check-ins
    if (type === 'success') {
        playSuccessSound();
    }
}

// Update the log submission function to use the new toast (replace the old 'alert'):
// (Inside your main submission function in script.js)
// ...
    // 5. Confirmation and Cleanup (The new high-impact message)
    const auditID = Math.floor(Math.random() * 90000) + 10000;
    showToast('SUCCESS: AUDIT LOGGED', `Guest ${guestName} checked-in. Audit ID: #${auditID}`, 'success');
// ...

// Add this function to script.js
function displayAuditLog() {
    let logs = localStorage.getItem('guestLogs');
    logs = logs ? JSON.parse(logs) : [];
    
    const tableBody = document.querySelector('#auditLogTable tbody');
    tableBody.innerHTML = ''; // Clear existing rows

    // Show only the last 10 entries for a quick live view
    const recentLogs = logs.slice(-10).reverse(); 

    recentLogs.forEach(entry => {
        const row = tableBody.insertRow();
        
        // Format the time nicely for the manager's eye
        const logTime = new Date(entry.logTime).toLocaleString('en-KE', { 
            hour: '2-digit', 
            minute: '2-digit', 
            day: '2-digit', 
            month: 'short' 
        });

        row.insertCell().textContent = logTime;
        row.insertCell().textContent = entry.name;
        row.insertCell().textContent = entry.id.substring(0, 4) + '...'; // Partial ID for privacy
        row.insertCell().textContent = entry.unit;
    });
}

// Ensure this runs when the manager page loads (put this at the end of script.js)
if (document.getElementById('auditLogTable')) {
    displayAuditLog();
}

// Add this to script.js
function checkManagerAccess() {
    if (window.location.pathname.endsWith('manager.html')) {
        const password = prompt("Manager: Enter Audit Export Password:");
        const MANAGER_PASSWORD = "EldoretAudit25"; // Hardcoded for demo/illusion

        if (password !== MANAGER_PASSWORD) {
            // If wrong, lock them out and redirect
            alert("Access Denied. Contact Admin for Access Key.");
            window.location.href = 'checkin.html'; // Send them back to the staff page
        } else {
            // Access granted, load the manager data
            document.body.style.display = 'block'; // Show the content (initially hidden by CSS)
            displayAuditLog();
        }
    }
}

// Call this immediately when the page loads (e.g., in a separate <script> block or at the end of script.js)
// You need to hide the <body> by default in manager.html's CSS:
// body { display: none; } 
// And call checkManagerAccess() at the bottom of script.js

// Check if the page is manager.html and trigger the check
if (document.getElementById('auditLogTable')) {
    checkManagerAccess();
}