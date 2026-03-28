// Core Mock Data Setup (used when API is unreachable — e.g. file://)
let WARD_CAPACITY = 24;
let apiMode = false;

let beds = [
    { id: 1, number: '101A', status: 'occupied', patientName: 'James Carter', condition: 'Pneumonia', doctor: 'Dr. Jenkins', admissionDate: 'Mar 24', categoryLOS: 3, actualLOS: 5 }, // LOS Outlier
    { id: 2, number: '101B', status: 'available' },
    { id: 3, number: '102A', status: 'occupied', patientName: 'Maria Garcia', condition: 'Post-Op Obs', doctor: 'Dr. Smith', admissionDate: 'Mar 26', markedForDischarge: true, markedDischargeTime: new Date(Date.now() - 3*60*60*1000) }, // Discharge Overdue Flag
    { id: 4, number: '102B', status: 'cleaning', cleaningStartTime: new Date(Date.now() - 45*60*1000) }, // Cleaning Overdue Flag
    { id: 5, number: '103A', status: 'reserved' },
    { id: 6, number: '103B', status: 'occupied', patientName: 'Robert Chen', condition: 'Cardiac Flow', doctor: 'Dr. Jenkins', admissionDate: 'Mar 27' }
];

// Fill remaining beds to WARD_CAPACITY
for (let i = 7; i <= WARD_CAPACITY; i++) {
    const isOccupied = Math.random() > 0.4;
    if (isOccupied) {
        beds.push({
            id: i,
            number: `10${Math.floor(i/2) + 1}${i%2===0?'B':'A'}`,
            status: 'occupied',
            patientName: `Patient ${i}`,
            condition: 'General Monitoring',
            doctor: 'Dr. Smith',
            admissionDate: new Date(Date.now() - Math.floor(Math.random()*3)*24*60*60*1000).toLocaleDateString(undefined, {month:'short', day:'numeric'})
        });
    } else {
        beds.push({ id: i, number: `10${Math.floor(i/2) + 1}${i%2===0?'B':'A'}`, status: 'available' });
    }
}

// Action Queues
let discharges = [
    { id: 101, patientName: 'Elena Rostova', bed: '105A', estTime: '14:30' },
    { id: 102, patientName: 'Maria Garcia', bed: '102A', estTime: '11:00' }
];

let admissions = [
    { id: 201, patientName: 'David Kim', source: 'Emergency Dept', estTime: '16:45' },
    { id: 202, patientName: 'Sarah Al-Amin', source: 'Elective Surgery', estTime: '17:30' }
];

// Hospital Wide Data
let allWards = [
    { name: 'General Ward 3A', capacity: 24, occupied: 18, pD: 2, pA: 2 },
    { name: 'Intensive Care (ICU)', capacity: 12, occupied: 11, pD: 0, pA: 1, shortStaffed: true, neededStaff: 'Critical Care RN' },
    { name: 'Pediatrics 2B', capacity: 18, occupied: 10, pD: 4, pA: 1 },
    { name: 'Surgical Recovery', capacity: 30, occupied: 28, pD: 5, pA: 4, shortStaffed: true, neededStaff: 'EVS Team' }
];

// Staff List
let staffList = [
    { id: 's1', name: 'Nurse Thompson', role: 'Charge RN' },
    { id: 's2', name: 'Nurse Davies', role: 'Staff RN' },
    { id: 's3', name: 'Res. Patel', role: 'Surgical Res.' },
    { id: 's4', name: 'Tech. Rodriquez', role: 'EVS Team' },
    { id: 's5', name: 'Nurse Carter', role: 'Critical Care RN' },
    { id: 's6', name: 'Tech. Smith', role: 'EVS Cleaner' }
];

let escalationFlags = [];
let currentFilter = 'all';

function applyDashboard(data) {
    WARD_CAPACITY = data.wardCapacity || 24;
    beds = data.beds;
    discharges = data.discharges;
    admissions = data.admissions;
    allWards = data.wards;
    staffList = data.staff;
    escalationFlags = data.escalationFlags || [];
}

async function tryLoadDashboard() {
    try {
        const r = await fetch('/api/dashboard');
        if (!r.ok) return false;
        applyDashboard(await r.json());
        apiMode = true;
        return true;
    } catch {
        return false;
    }
}

// DOM Elements
const bedsContainer = document.getElementById('beds-container');
const flagsContainer = document.getElementById('flags-container');
const qDischarge = document.getElementById('queue-discharge');
const qAdmit = document.getElementById('queue-admit');
const viewDashboard = document.getElementById('view-dashboard');
const viewMulti = document.getElementById('view-multi-ward');
const viewStaff = document.getElementById('view-staff');

function getBellElements() {
    return {
        bellBtn: document.getElementById('bell-btn'),
        bellCount: document.getElementById('bell-count'),
        bellPopover: document.getElementById('bell-popover')
    };
}


async function init() {
    const loaded = await tryLoadDashboard();
    if (!loaded) {
        processEscalations();
    } else {
        renderFlags();
    }
    applyRole();
    renderBeds();
    renderQueues();
    renderForecast();
    renderDischargeReview();
    setupNavigation();
    setupMultiWard();
    setupStaffAssignment();
    initBellNotifications();
}

function applyRole() {
    const role = localStorage.getItem('wardwatch_role') || 'doctor';
    const userName = document.getElementById('user-name');
    const userRole = document.getElementById('user-role');
    const pageTitle = document.getElementById('page-title');
    const pageSub = document.getElementById('page-subtitle');
    const avatar = document.getElementById('avatar-icon');
    
    // Reset defaults
    document.querySelectorAll('.btn-secondary, .q-action-btn, .bed-action-overlay').forEach(el => el.style.display = '');
    const elDash = document.getElementById('nav-dashboard');
    const elMulti = document.getElementById('nav-multi-ward');
    const elStaff = document.getElementById('nav-staff');
    const elHand = document.getElementById('nav-handover-tab');
    const elForce = document.querySelector('.forecast-widget');
    
    if(elDash) elDash.style.display = '';
    if(elMulti) elMulti.style.display = '';
    if(elStaff) elStaff.style.display = '';
    if(elHand) elHand.style.display = '';
    if(elForce) elForce.style.display = '';
    
    document.querySelectorAll('.w-tab').forEach(t => t.style.display = 'inline-block');
    const queuesPanel = document.querySelector('.queues-panel');
    if (queuesPanel) queuesPanel.style.display = 'flex';
    const dashLayout = document.querySelector('.dashboard-layout');
    if (dashLayout) {
        dashLayout.classList.remove('no-queues');
        dashLayout.classList.add('has-queues');
    }

    if (role === 'admin') {
        if(userName) userName.textContent = 'Cmdr. Harrison';
        if(userRole) userRole.textContent = 'Hospital Administrator';
        if(pageTitle) pageTitle.textContent = 'Global Overview';
        if(pageSub) pageSub.textContent = 'Situational Awareness Read-Only';
        if(avatar) avatar.innerHTML = '<i class="fa-solid fa-shield-halved"></i>';
        
        
        // Disable Interactions
        document.querySelectorAll('.btn-secondary, .q-action-btn, .bed-action-overlay').forEach(el => el.style.display = 'none');
        
        if(elDash) elDash.style.display = 'none';
        if(elHand) elHand.style.display = 'none';
        if(elForce) elForce.style.display = 'none';
        
        if(elMulti) elMulti.click();
    } else if (role === 'nurse') {
        if(userName) userName.textContent = 'Nurse Thompson';
        if(userRole) userRole.textContent = 'Critical Care RN';
        if(pageTitle) pageTitle.textContent = 'General Ward 3A';
        if(pageSub) pageSub.textContent = 'Nursing Station & Meds';
        if(avatar) avatar.innerHTML = '<i class="fa-solid fa-user-nurse"></i>';
        
        if(elMulti) elMulti.style.display = 'none';
        if(elStaff) elStaff.style.display = 'none';
        
        // Hide unused tabs
        document.querySelectorAll('.w-tab').forEach(t => {
            if (['tab-schedule', 'tab-history', 'tab-discharge'].includes(t.dataset.target)) {
                t.style.display = 'none';
            }
        });
        const medsTab = document.querySelector('.w-tab[data-target="tab-meds"]');
        if (medsTab) medsTab.click();
        if(elDash) elDash.click();
    } else if (role === 'cleaner') {
        if(userName) userName.textContent = 'Tech. Rodriquez';
        if(userRole) userRole.textContent = 'EVS Team';
        if(pageTitle) pageTitle.textContent = 'General Ward 3A';
        if(pageSub) pageSub.textContent = 'EVS Operations';
        if(avatar) avatar.innerHTML = '<i class="fa-solid fa-broom"></i>';
        
        if(elMulti) elMulti.style.display = 'none';
        if(elStaff) elStaff.style.display = 'none';
        if(elHand) elHand.style.display = 'none';
        
        if (queuesPanel) queuesPanel.style.display = 'none';
        if (dashLayout) {
            dashLayout.classList.remove('has-queues');
            dashLayout.classList.add('no-queues');
        }
        
        // Only show beds tab
        document.querySelectorAll('.w-tab').forEach(t => {
            if (t.dataset.target !== 'tab-beds') t.style.display = 'none';
        });
        const bedsTab = document.querySelector('.w-tab[data-target="tab-beds"]');
        if (bedsTab) bedsTab.click();
        if(elDash) elDash.click();
        
        // Pre-filter to cleaning
        currentFilter = 'cleaning';
        const cleanBtn = document.querySelector('.filter-btn[data-filter="cleaning"]');
        if (cleanBtn) {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            cleanBtn.classList.add('active');
        }
    } else {
        // Doctor Role Requirements
        if(elMulti) elMulti.style.display = 'none';
        if(elStaff) elStaff.style.display = 'none';
        
        if(elDash) elDash.click();
    }
}

function processEscalations() {
    if (apiMode) return;
    escalationFlags = [];
    let occupiedCount = beds.filter(b => b.status === 'occupied').length;
    
    // 1. Discharge > 2hrs
    beds.filter(b => b.status === 'occupied' && b.markedForDischarge).forEach(bed => {
        const hrs = (Date.now() - new Date(bed.markedDischargeTime).getTime()) / (1000 * 60 * 60);
        if (hrs > 2) escalationFlags.push({ type: 'warn', text: `Transport Delay: Bed ${bed.number} discharged > ${hrs.toFixed(1)} hrs ago.`, icon: 'fa-person-walking-arrow-right', action: 'Notify Transport' });
    });

    // 2. Cleaning > 30mins
    beds.filter(b => b.status === 'cleaning').forEach(bed => {
        if (bed.cleaningStartTime) {
            const mins = (Date.now() - new Date(bed.cleaningStartTime).getTime()) / (1000 * 60);
            if (mins > 30) escalationFlags.push({ type: 'warn', text: `EVS Delay: Bed ${bed.number} cleaning > 30 mins.`, icon: 'fa-broom', action: 'Chase EVS' });
        }
    });

    // 3. LOS Outlier
    beds.filter(b => b.status === 'occupied' && b.actualLOS > (b.categoryLOS||99)+1).forEach(bed => {
       escalationFlags.push({ type: 'crit', text: `Clinical Outlier: ${bed.patientName} (${bed.condition}) Day ${bed.actualLOS}.`, icon: 'fa-calendar-xmark', action: 'Flag Review' });
    });

    // 4. Capacity Risk
    let exp = occupiedCount - discharges.length + admissions.length;
    if (exp / WARD_CAPACITY > 0.9) {
        escalationFlags.push({ type: 'crit', text: `Capacity Crunch: Projected > 90% utilization by 4:00 PM.`, icon: 'fa-triangle-exclamation', action: 'Triage Override' });
    }

    renderFlags();
}

function renderFlags() {
    if(!flagsContainer) return;
    flagsContainer.innerHTML = '';
    escalationFlags.forEach(flag => {
        flagsContainer.innerHTML += `
            <div class="alert-banner ${flag.type}">
                <div style="display:flex; align-items:center; gap:12px;">
                    <i class="fa-solid ${flag.icon}"></i>
                    <span>${flag.text}</span>
                </div>
            </div>
        `;
    });
    
    // Status Bell Notification
    const count = escalationFlags.length;
    const { bellBtn, bellCount, bellPopover } = getBellElements();
    if(bellCount) {
        bellCount.style.display = count > 0 ? 'flex' : 'none';
        bellCount.textContent = count;
    }
    if(bellBtn) {
        bellBtn.title = count > 0 ? `${count} active alert${count === 1 ? '' : 's'}` : 'No active alerts';
    }
    renderBellPopover();
}

function renderBellPopover() {
    const { bellPopover } = getBellElements();
    if(!bellPopover) return;
    if (escalationFlags.length === 0) {
        bellPopover.innerHTML = `<div style="color:var(--text-secondary); font-size:0.95rem; padding:1rem; text-align:center;">No active escalations.</div>`;
        return;
    }

    bellPopover.innerHTML = escalationFlags.map(flag => `
        <div style="display:flex; align-items:flex-start; gap:10px; margin-bottom:14px; padding-bottom:12px; border-bottom:1px solid rgba(148,163,184,0.16);">
            <div style="font-size:1rem; color:var(--text-primary); margin-top:2px;"><i class="fa-solid ${flag.icon}"></i></div>
            <div>
                <div style="font-size:0.95rem; font-weight:600; color:var(--text-primary);">${flag.type === 'crit' ? 'Critical' : 'Warning'}</div>
                <div style="color:var(--text-secondary); font-size:0.9rem; margin-top:4px;">${flag.text}</div>
            </div>
        </div>
    `).join('');
}

function initBellNotifications() {
    const { bellBtn, bellPopover } = getBellElements();
    if (!bellBtn || !bellPopover) return;

    bellBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        bellPopover.style.display = bellPopover.style.display === 'block' ? 'none' : 'block';
    });

    bellPopover.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    window.addEventListener('click', (event) => {
        if (!bellPopover || !bellBtn) return;
        if (bellBtn.contains(event.target) || bellPopover.contains(event.target)) return;
        bellPopover.style.display = 'none';
    });
}

function getIcon(status) {
    if(status==='occupied') return 'fa-bed-pulse';
    if(status==='available') return 'fa-check';
    if(status==='cleaning') return 'fa-sparkles';
    if(status==='reserved') return 'fa-lock';
    return '';
}

function renderBeds() {
    if(!bedsContainer) return;
    bedsContainer.innerHTML = '';
    
    const filtered = currentFilter === 'all' ? beds : beds.filter(b => b.status === currentFilter);
    
    const allFilterBtn = document.querySelector('.filter-btn[data-filter="all"]');
    if (allFilterBtn) {
        allFilterBtn.textContent = `All (${WARD_CAPACITY})`;
    }

    // Setup Filter Buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        const filter = btn.dataset.filter;
        btn.onclick = (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentFilter = filter;
            renderBeds();
        };
    });

    filtered.forEach(b => {
        let content = `
            <div class="bed-top">
                <span class="bed-number">${b.number}</span>
                <span class="status-pill"><div class="dot"></div> ${b.status}</span>
            </div>
        `;

        if (b.status === 'occupied') {
            content += `
                <div class="patient-info">
                    <span class="patient-name">${b.patientName}</span>
                    <span class="patient-detail"><i class="fa-solid fa-stethoscope"></i> ${b.condition}</span>
                </div>
                <div class="bed-footer">
                    <span>${b.doctor}</span>
                    <span style="color:var(--text-secondary)">Admit: ${b.admissionDate}</span>
                </div>
            `;
        } else if (b.status === 'cleaning') {
             content += `
                <div class="patient-info">
                    <span class="patient-name" style="color:var(--status-clean)">EVS In Progress</span>
                    <span class="patient-detail"><i class="fa-regular fa-clock"></i> Since ${new Date(b.cleaningStartTime||Date.now()).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                </div>
            `;
        } else if (b.status === 'reserved') {
            content += `
                <div class="patient-info" style="align-items:center; justify-content:center;">
                    <span class="patient-name" style="color:var(--status-res); text-align:center;">ED Transfer Incoming</span>
                </div>
            `;
        } else {
             content += `
                <div class="empty-bed-icon"><i class="fa-solid fa-bed"></i></div>
            `;
        }

        // 2-Tap Action Overlay Setup
        if(localStorage.getItem('wardwatch_role') !== 'admin') {
            const role = localStorage.getItem('wardwatch_role');
            let actions = '';
            if (role === 'cleaner') {
                if (b.status === 'cleaning') {
                    actions += `<button class="action-btn a-avail" onclick="updateStatus(${b.id}, 'available', event)"><i class="fa-solid fa-check"></i> Set Available</button>`;
                } else if (b.status === 'available') {
                    actions += `<button class="action-btn a-clean" onclick="updateStatus(${b.id}, 'cleaning', event)"><i class="fa-solid fa-broom"></i> Set Cleaning</button>`;
                }
            } else {
                actions += `<button class="action-btn a-avail" onclick="updateStatus(${b.id}, 'available', event)"><i class="fa-solid fa-check"></i> Set Available</button>`;
                actions += (b.status !== 'cleaning' ? `<button class="action-btn a-clean" onclick="updateStatus(${b.id}, 'cleaning', event)"><i class="fa-solid fa-broom"></i> Set Cleaning</button>` : '');
                actions += `<button class="action-btn a-occ" onclick="updateStatus(${b.id}, 'occupied', event)"><i class="fa-solid fa-user-injured"></i> Set Occupied</button>`;
                if (b.status === 'occupied') {
                    actions += `<button class="action-btn a-discharge" onclick="updateStatus(${b.id}, 'send_for_discharge', event)"><i class="fa-solid fa-person-walking-arrow-right"></i> Send for Discharge</button>`;
                }
            }
            actions += `<button class="action-btn" onclick="toggleOverlay(${b.id}, false, event)" style="border-color:transparent; justify-content:center; color:var(--text-muted); opacity:0.8"><i class="fa-solid fa-xmark"></i> Close</button>`;

            content += `
                <div class="bed-action-overlay">
                    ${actions}
                </div>
            `;
        }

        const tile = document.createElement('div');
        tile.className = `bed-card status-${b.status}`;
        tile.innerHTML = content;
        
        // 1st Tap: Open Action Menu
        if(localStorage.getItem('wardwatch_role') !== 'admin') {
            tile.onclick = () => {
                document.querySelectorAll('.bed-card').forEach(t => t.classList.remove('show-actions'));
                tile.classList.add('show-actions');
            };
        }

        bedsContainer.appendChild(tile);
    });
}

// Close individual overlays via JS (for the Close button)
window.toggleOverlay = function(id, state, e) {
    e.stopPropagation();
    const el = e.target.closest('.bed-card');
    if(el) state ? el.classList.add('show-actions') : el.classList.remove('show-actions');
};

window.updateStatus = async function(id, status, e) {
    e.stopPropagation();
    if (apiMode) {
        try {
            const r = await fetch(`/api/beds/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            const data = await r.json();
            if (data.dashboard) applyDashboard(data.dashboard);
        } catch (err) {
            console.error(err);
        }
    } else {
        const bed = beds.find(b => b.id === id);
        if (bed) {
            bed.status = status;
            if (status === 'cleaning') bed.cleaningStartTime = new Date();
            else delete bed.cleaningStartTime;

            if (status === 'send_for_discharge') {
                bed.markedForDischarge = true;
                bed.markedDischargeTime = new Date();
                // add to discharges if not already
                if (!discharges.find(d => d.bed === bed.number)) {
                    discharges.push({
                        id: Date.now(),
                        patientName: bed.patientName,
                        bed: bed.number,
                        estTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    });
                }
            } else if (status !== 'occupied') {
                delete bed.patientName;
                delete bed.condition;
                delete bed.doctor;
                delete bed.markedForDischarge;
            }
        }
        processEscalations();
    }
    renderBeds();
    renderFlags();
    renderForecast();
    renderQueues();
    renderDischargeReview();
};

function renderQueues() {
    if(!qDischarge || !qAdmit) return;
    document.getElementById('count-discharge').textContent = discharges.length;
    document.getElementById('count-admit').textContent = admissions.length;

    qDischarge.innerHTML = discharges.map((d, i) => `
        <div class="queue-item">
            <div class="q-info">
                <h4>${d.patientName} • Bed ${d.bed}</h4>
                <p><i class="fa-solid fa-clock"></i> Target: ${d.estTime}</p>
            </div>
            ${localStorage.getItem('wardwatch_role') !== 'admin' ? `
            <button class="q-action-btn done" onclick="dischargePatient(${i}, '${d.bed}')"><i class="fa-solid fa-check"></i></button>
            ` : ''}
        </div>
    `).join('');

    qAdmit.innerHTML = admissions.map((a, i) => `
        <div class="queue-item">
            <div class="q-info">
                <h4 style="color:var(--text-primary)">${a.patientName}</h4>
                <p><i class="fa-solid fa-location-dot"></i> ${a.source} (ETA: ${a.estTime})</p>
            </div>
            ${localStorage.getItem('wardwatch_role') !== 'admin' ? `
            <button class="q-action-btn admit" onclick="admitPatient(${i})"><i class="fa-solid fa-arrow-right-to-bracket"></i></button>
            ` : ''}
        </div>
    `).join('');
}

window.dischargePatient = async function(idx, bNum) {
    if (apiMode) {
        try {
            const r = await fetch(`/api/queues/discharges/${idx}/complete`, { method: 'POST' });
            if (r.ok) applyDashboard(await r.json());
        } catch (err) {
            console.error(err);
        }
    } else {
        discharges.splice(idx, 1);
        const bed = beds.find(b => b.number === bNum);
        if (bed) {
            bed.status = 'cleaning';
            bed.cleaningStartTime = new Date();
            delete bed.patientName;
            delete bed.markedForDischarge;
        }
        processEscalations();
    }
    renderQueues();
    renderBeds();
    renderFlags();
    renderForecast();
    renderDischargeReview();
};

window.admitPatient = async function(idx) {
    if (apiMode) {
        try {
            const r = await fetch(`/api/queues/admissions/${idx}/assign`, { method: 'POST' });
            const data = await r.json();
            if (r.ok) {
                applyDashboard(data);
            } else if (data.dashboard) {
                applyDashboard(data.dashboard);
                alert('System Warning: No beds available. Admission halted.');
            }
        } catch (err) {
            console.error(err);
        }
    } else {
        const admitted = admissions.splice(idx, 1)[0];
        const avail = beds.find(b => b.status === 'available' || b.status === 'reserved');
        if (avail) {
            avail.status = 'occupied';
            avail.patientName = admitted.patientName;
            avail.condition = 'Initial Consult';
            avail.doctor = 'TBD';
            avail.admissionDate = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        } else {
            admissions.push(admitted);
            alert('System Warning: No beds available. Admission halted.');
        }
        processEscalations();
    }
    renderQueues();
    renderBeds();
    renderFlags();
    renderForecast();
    renderDischargeReview();
};

function renderForecast() {
    const el4 = document.getElementById('forecast-val-4');
    const el8 = document.getElementById('forecast-val-8');
    if(!el4 || !el8) return;
    
    let current = beds.filter(b => b.status === 'occupied').length;
    let dischargeCount = discharges.length;
    let admissionCount = admissions.length;

    const expected4 = Math.max(0, Math.min(WARD_CAPACITY, current - dischargeCount + admissionCount));
    const expected8 = Math.max(0, Math.min(WARD_CAPACITY, expected4 - Math.max(0, Math.floor(dischargeCount * 0.5)) + Math.max(0, Math.ceil(admissionCount * 0.4))));

    let currentPct = Math.round((current / WARD_CAPACITY) * 100);
    let p4 = Math.round((expected4 / WARD_CAPACITY) * 100);
    let p8 = Math.round((expected8 / WARD_CAPACITY) * 100);

    el4.innerHTML = `${expected4} / ${WARD_CAPACITY} beds (${p4}%)`;
    el8.innerHTML = `${expected8} / ${WARD_CAPACITY} beds (${p8}%)`;

    const elCap = document.getElementById('forecast-val-capacity');
    if (elCap) {
        elCap.innerHTML = `${current} / ${WARD_CAPACITY} beds (${currentPct}%)`;
    }

    const c4 = document.getElementById('forecast-card-4');
    const c8 = document.getElementById('forecast-card-8');
    
    c4.className = `forecast-pill ${p4 >= 90 ? 'crit' : p4 >= 80 ? 'warn' : ''}`;
    c8.className = `forecast-pill ${p8 >= 90 ? 'crit' : p8 >= 80 ? 'warn' : ''}`;
}

function renderDischargeReview() {
    const container = document.getElementById('tab-discharge');
    if (!container) return;
    const reviewList = container.querySelector('.module-card');
    if (!reviewList) return;
    
    const pendingReviews = beds.filter(b => b.status === 'occupied' && b.markedForDischarge);
    
    reviewList.innerHTML = pendingReviews.map(bed => `
        <div class="list-item" style="border-left:3px solid var(--accent-blue)">
            <div class="q-info">
                <h4>${bed.patientName} (Bed ${bed.number})</h4>
                <p>${bed.condition} completed. Vitals stable. Pending attending sign-off.</p>
            </div>
            <button class="btn btn-primary" onclick="signOffDischarge(${bed.id})">Sign Off</button>
        </div>
    `).join('');
}

window.signOffDischarge = async function(bedId) {
    if (apiMode) {
        try {
            const r = await fetch(`/api/beds/${bedId}/signoff`, { method: 'POST' });
            if (r.ok) {
                applyDashboard(await r.json());
            }
        } catch (err) {
            console.error(err);
        }
    } else {
        const bed = beds.find(b => b.id === bedId);
        if (bed) {
            bed.status = 'available';
            delete bed.patientName;
            delete bed.condition;
            delete bed.doctor;
            delete bed.admissionDate;
            delete bed.markedForDischarge;
            delete bed.markedDischargeTime;
            delete bed.categoryLOS;
            delete bed.actualLOS;
            // remove from discharges
            const dIdx = discharges.findIndex(d => d.bed === bed.number);
            if (dIdx >= 0) discharges.splice(dIdx, 1);
        }
        processEscalations();
    }
    renderDischargeReview();
    renderQueues();
    renderBeds();
    renderFlags();
    renderForecast();
};

window.toggleWardBeds = function(idx) {
    const el = document.getElementById(`avail-beds-${idx}`);
    if(el) {
        el.style.display = el.style.display === 'none' ? 'block' : 'none';
    }
};

window.gotoStaffReassignment = function(wardName) {
    const staffTab = document.getElementById('nav-staff');
    if (staffTab) {
        staffTab.click();
    }
};

function setupMultiWard() {
    const mCard = document.getElementById('multi-ward-container');
    if(!mCard) return;
    
    mCard.innerHTML = allWards.map((w, idx) => {
        let p = Math.round((w.occupied / w.capacity) * 100);
        let grad = p >= 90 ? 'var(--status-occ)' : p >= 75 ? 'var(--status-clean)' : 'var(--gradient-glow)';
        let availBedsCount = w.capacity - w.occupied;
        let mockBeds = Array.from({length: availBedsCount}, (_, i) => `${idx+1}0${i+1}${Math.random()>0.5?'A':'B'}`).join(', ');
        
        return `
            <div class="ward-macro-card bed-card" style="cursor:pointer" onclick="toggleWardBeds(${idx})">
                <div class="ward-macro-top">
                    <span class="w-title">${w.name} ${w.shortStaffed ? '<span style="color:var(--status-occ); font-size:0.8rem; margin-left:8px;"><i class="fa-solid fa-triangle-exclamation"></i> Short Staffed</span>' : ''}</span>
                    <span class="w-pct" style="color:${p>=90?'var(--status-occ)':'var(--text-primary)'}">${p}%</span>
                </div>
                <div class="progress-bg"><div class="progress-fill" style="width:${p}%; background:${grad}"></div></div>
                <div class="w-stats">
                    <div style="display:flex; justify-content:space-between"><span>Active Volume:</span> <strong>${w.occupied} / ${w.capacity}</strong></div>
                    <div class="avail-beds-list" id="avail-beds-${idx}" style="display:none; margin-top:12px; padding-top:12px; border-top:1px dashed var(--border-color); color:var(--text-secondary);">
                        <strong style="color:var(--status-avail)">Available Beds (${availBedsCount}):</strong> ${mockBeds || 'None'}
                    </div>
                </div>
                ${w.shortStaffed ? `
                <div style="margin-top:16px;">
                    <button class="btn btn-primary" style="width:100%; font-size:0.8rem; padding:8px;" onclick="event.stopPropagation(); gotoStaffReassignment('${w.name}')"><i class="fa-solid fa-users"></i> Reassign Staff Needs</button>
                </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function setupStaffAssignment() {
    const sC = document.getElementById('staff-drag-drop');
    if(!sC) return;
    
    sC.innerHTML = `
        <div class="staff-pool">
            <h3 style="font-size:1.1rem; border-bottom:1px solid var(--border-color); padding-bottom:16px; margin-bottom:8px;">Available Assets</h3>
            ${staffList.map(s => `
                <div class="draggable-staff" draggable="true" data-id="${s.id}">
                    <i class="fa-solid fa-${s.role.includes('RN')||s.role.includes('Nurse') ? 'user-nurse' : (s.role.includes('EVS') ? 'broom' : 'user-doctor')}"></i>
                    <div><div style="font-weight:600; font-size:0.95rem; color:var(--text-primary)">${s.name}</div><div style="font-size:0.8rem; color:var(--text-muted)">${s.role}</div></div>
                </div>
            `).join('')}
        </div>
        <div class="staff-zones">
            ${allWards.map(w => `
                <div class="drop-zone ${w.shortStaffed ? 'short-staffed' : ''}" data-ward="${w.name}" style="${w.shortStaffed ? 'border-color:var(--status-occ); background:rgba(239,68,68,0.05);' : ''}">
                    <h3 style="font-size:1.1rem; color:${w.shortStaffed ? 'var(--status-occ)' : 'var(--text-secondary)'}; margin-bottom:8px;">
                        ${w.name} ${w.shortStaffed ? '<i class="fa-solid fa-triangle-exclamation"></i>' : ''}
                    </h3>
                    ${w.shortStaffed ? `<p style="color:var(--status-occ); font-size:0.85rem; margin-bottom:16px;">Needs: ${w.neededStaff}</p>` : '<p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:16px;">Staffing nominal</p>'}
                </div>
            `).join('')}
        </div>
    `;

    // Drag & Drop Init
    const drags = document.querySelectorAll('.draggable-staff');
    const drops = document.querySelectorAll('.drop-zone, .staff-pool');

    drags.forEach(d => {
        d.addEventListener('dragstart', () => d.classList.add('is-dragging'));
        d.addEventListener('dragend', () => d.classList.remove('is-dragging'));
    });

    drops.forEach(z => {
        z.addEventListener('dragover', e => { e.preventDefault(); z.classList.add('drag-over'); });
        z.addEventListener('dragleave', () => z.classList.remove('drag-over'));
        z.addEventListener('drop', e => {
            e.preventDefault();
            z.classList.remove('drag-over');
            const el = document.querySelector('.is-dragging');
            if (!el) return;

            const wardName = z.dataset.ward;
            const wardIdx = wardName != null ? allWards.findIndex((w) => w.name === wardName) : -1;

            if (apiMode && z.classList.contains('drop-zone') && z.classList.contains('short-staffed') && wardIdx >= 0) {
                fetch(`/api/wards/${wardIdx}/resolve-staffing`, { method: 'PATCH' })
                    .then((r) => r.json())
                    .then((d) => {
                        applyDashboard(d);
                        setupMultiWard();
                        setupStaffAssignment();
                    })
                    .catch((err) => console.error(err));
                return;
            }

            z.appendChild(el);
            if (z.classList.contains('short-staffed')) {
                z.classList.remove('short-staffed');
                z.style.borderColor = 'var(--status-avail)';
                z.style.background = 'rgba(16,185,129,0.05)';
                const w = allWards.find((x) => x.name === wardName);
                if (w) w.shortStaffed = false;

                const h = z.querySelector('h3');
                if (h) {
                    h.style.color = 'var(--status-avail)';
                    h.innerHTML = `${wardName} <i class="fa-solid fa-check-circle"></i>`;
                }
                const p = z.querySelector('p');
                if (p) {
                    p.style.color = 'var(--status-avail)';
                    p.textContent = 'Staffing resolved';
                }
                setupMultiWard();
            }
        });
    });
}

window.generateHandover = function() {
    const el = document.getElementById('handover-content');
    if(!el) return;
    
    let handledPatients = beds.filter(b => b.status === 'occupied');
    let completedDischarges = 4; // Mock standard successful metrics
    
    el.innerHTML = `
        <h2 style="font-size:1.8rem; margin-bottom:4px; color:var(--text-primary)">Official Shift Report</h2>
        <p style="color:var(--text-muted); padding-bottom:16px; border-bottom:1px solid var(--border-color); margin-bottom:24px;">Generated: ${new Date().toLocaleString()}</p>
        
        <div class="responsive-two-col">
            <div style="background:rgba(255,255,255,0.02); padding:20px; border-radius:12px; border:1px solid var(--border-color);">
                <h4 style="color:var(--text-primary); margin-bottom:12px;"><i class="fa-solid fa-list-check"></i> Shift Summary Metrics</h4>
                <ul style="color:var(--text-secondary); line-height:1.6; list-style:none;">
                    <li>Patients Actively Handled: <strong style="color:var(--text-primary)">${handledPatients.length} Active Consults</strong></li>
                    <li>Successful Discharges Executed: <strong style="color:var(--status-avail)">${completedDischarges} Patients</strong></li>
                    <li>Admissions Received: <strong style="color:var(--text-primary)">2 Patients</strong></li>
                </ul>
            </div>
            
            <div style="background:rgba(255,255,255,0.02); padding:20px; border-radius:12px; border:1px solid var(--border-color); ${escalationFlags.length > 0 ? 'border-left:4px solid var(--status-occ);' : ''}">
                <h4 style="color:${escalationFlags.length>0?'var(--status-occ)':'var(--text-primary)'}; margin-bottom:12px;"><i class="fa-solid fa-triangle-exclamation"></i> Escalations Encountered</h4>
                ${escalationFlags.length === 0 ? '<p style="color:var(--text-secondary); font-size:0.9rem;">No delays or outliers recorded. Shift nominal.</p>' : `
                <ul style="color:var(--text-secondary); line-height:1.6; list-style:none;">
                    ${escalationFlags.map(f => `<li>• ${f.text}</li>`).join('')}
                </ul>`}
            </div>
        </div>

        <h3 style="margin-bottom:16px; font-size:1.2rem; color:var(--text-primary);"><i class="fa-solid fa-users"></i> Detailed Patient Roster Handover</h3>
        <div class="handover-table-wrap">
        <table style="width:100%; min-width:520px; border-collapse:collapse; text-align:left; color:var(--text-secondary); font-size:0.9rem;">
            <thead>
                <tr style="border-bottom:1px solid var(--border-color); color:var(--text-primary);">
                    <th style="padding:12px 8px;">Bed</th>
                    <th style="padding:12px 8px;">Patient Name</th>
                    <th style="padding:12px 8px;">Condition / Overview</th>
                    <th style="padding:12px 8px;">Admit Date</th>
                </tr>
            </thead>
            <tbody>
                ${handledPatients.map(b => `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                    <td style="padding:12px 8px; color:var(--text-primary); font-weight:600;">${b.number}</td>
                    <td style="padding:12px 8px;">${b.patientName}</td>
                    <td style="padding:12px 8px;">${b.condition}</td>
                    <td style="padding:12px 8px;">${b.admissionDate}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        </div>
    `;
};

function setupNavigation() {
    const map = {
        'nav-dashboard': 'view-dashboard',
        'nav-multi-ward': 'view-multi-ward',
        'nav-staff': 'view-staff',
        'nav-handover-tab': 'view-handover'
    };

    const links = document.querySelectorAll('.nav-menu .nav-item');
    function closeMobileSidebar() {
        const sidebarEl = document.querySelector('.sidebar');
        const sidebarBackdrop = document.getElementById('sidebar-backdrop');
        if (!sidebarEl) return;
        sidebarEl.classList.remove('open');
        if (sidebarBackdrop) {
            sidebarBackdrop.classList.remove('visible');
            sidebarBackdrop.setAttribute('aria-hidden', 'true');
        }
    }

    links.forEach(l => {
        l.addEventListener('click', e => {
            e.preventDefault();
            const id = e.currentTarget.id;
            
            if (id === 'nav-handover-tab') {
                generateHandover();
            }

            const target = map[id];
            if(target) {
                document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active'));
                links.forEach(x => x.classList.remove('active'));
                
                document.getElementById(target).classList.add('active');
                e.currentTarget.classList.add('active');
            }
            closeMobileSidebar();
        });
    });

    // Workspace Quick Tabs (Doctor View)
    const wTabs = document.querySelectorAll('.workspace-tabs .w-tab');
    wTabs.forEach(tab => {
        tab.addEventListener('click', e => {
            // Remove active from all tabs
            wTabs.forEach(t => t.classList.remove('active'));
            // Remove active from all panes
            document.querySelectorAll('.w-tab-pane').forEach(p => p.classList.remove('active'));
            
            // Add active to clicked tab
            e.currentTarget.classList.add('active');
            // Show corresponding pane
            const targetId = e.currentTarget.dataset.target;
            const pane = document.getElementById(targetId);
            if(pane) pane.classList.add('active');
        });
    });

    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    const sidebarEl = document.querySelector('.sidebar');
    if (sidebarToggle && sidebarEl && sidebarBackdrop) {
        sidebarToggle.addEventListener('click', () => {
            const isClosed = sidebarEl.classList.contains('closed');
            const isOpen = sidebarEl.classList.contains('open');
            let open;
            if (isClosed) {
                open = true;
            } else if (isOpen) {
                open = false;
            } else {
                open = window.innerWidth <= 1024;
            }

            sidebarEl.classList.toggle('open', open);
            sidebarEl.classList.toggle('closed', !open);
            sidebarBackdrop.classList.toggle('visible', open);
            sidebarBackdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
            sidebarToggle.innerHTML = open ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
            sidebarToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
        });
        sidebarBackdrop.addEventListener('click', closeMobileSidebar);
    }
}

// Click anywhere to close bed overlays
document.addEventListener('click', (e) => {
    if(!e.target.closest('.bed-card')) {
        document.querySelectorAll('.bed-card').forEach(c => c.classList.remove('show-actions'));
    }
});

document.addEventListener('DOMContentLoaded', init);

// Autoplay videos on page load
window.addEventListener('load', function() {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
        video.play().catch(e => console.log('Autoplay blocked', e));
    });
});
