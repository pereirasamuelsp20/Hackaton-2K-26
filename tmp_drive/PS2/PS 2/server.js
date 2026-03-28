/**
 * WardWatch API — Express server with static file hosting and in-memory ward state.
 */
const path = require('path');
const express = require('express');

const WARD_CAPACITY = 24;
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

function buildInitialBeds() {
  let beds = [
    {
      id: 1,
      number: '101A',
      status: 'occupied',
      patientName: 'James Carter',
      condition: 'Pneumonia',
      doctor: 'Dr. Jenkins',
      admissionDate: 'Mar 24',
      categoryLOS: 3,
      actualLOS: 5,
    },
    { id: 2, number: '101B', status: 'available' },
    {
      id: 3,
      number: '102A',
      status: 'occupied',
      patientName: 'Maria Garcia',
      condition: 'Post-Op Obs',
      doctor: 'Dr. Smith',
      admissionDate: 'Mar 26',
      markedForDischarge: true,
      markedDischargeTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
    { id: 4, number: '102B', status: 'cleaning', cleaningStartTime: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
    { id: 5, number: '103A', status: 'reserved' },
    {
      id: 6,
      number: '103B',
      status: 'occupied',
      patientName: 'Robert Chen',
      condition: 'Cardiac Flow',
      doctor: 'Dr. Jenkins',
      admissionDate: 'Mar 27',
    },
  ];

  for (let i = 7; i <= WARD_CAPACITY; i++) {
    const isOccupied = Math.random() > 0.4;
    if (isOccupied) {
      beds.push({
        id: i,
        number: `10${Math.floor(i / 2) + 1}${i % 2 === 0 ? 'B' : 'A'}`,
        status: 'occupied',
        patientName: `Patient ${i}`,
        condition: 'General Monitoring',
        doctor: 'Dr. Smith',
        admissionDate: new Date(Date.now() - Math.floor(Math.random() * 3) * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
      });
    } else {
      beds.push({
        id: i,
        number: `10${Math.floor(i / 2) + 1}${i % 2 === 0 ? 'B' : 'A'}`,
        status: 'available',
      });
    }
  }
  return beds;
}

let beds = buildInitialBeds();

let discharges = [
  { id: 101, patientName: 'Elena Rostova', bed: '105A', estTime: '14:30' },
  { id: 102, patientName: 'Maria Garcia', bed: '102A', estTime: '11:00' },
];

let admissions = [
  { id: 201, patientName: 'David Kim', source: 'Emergency Dept', estTime: '16:45' },
  { id: 202, patientName: 'Sarah Al-Amin', source: 'Elective Surgery', estTime: '17:30' },
];

const allWards = [
  { name: 'General Ward 3A', capacity: 24, occupied: 18, pD: 2, pA: 2 },
  {
    name: 'Intensive Care (ICU)',
    capacity: 12,
    occupied: 11,
    pD: 0,
    pA: 1,
    shortStaffed: true,
    neededStaff: 'Critical Care RN',
  },
  { name: 'Pediatrics 2B', capacity: 18, occupied: 10, pD: 4, pA: 1 },
  {
    name: 'Surgical Recovery',
    capacity: 30,
    occupied: 28,
    pD: 5,
    pA: 4,
    shortStaffed: true,
    neededStaff: 'EVS Team',
  },
];

const staffList = [
  { id: 's1', name: 'Nurse Thompson', role: 'Charge RN' },
  { id: 's2', name: 'Nurse Davies', role: 'Staff RN' },
  { id: 's3', name: 'Res. Patel', role: 'Surgical Res.' },
  { id: 's4', name: 'Tech. Rodriquez', role: 'EVS Team' },
  { id: 's5', name: 'Nurse Carter', role: 'Critical Care RN' },
  { id: 's6', name: 'Tech. Smith', role: 'EVS Cleaner' },
];

function computeEscalations() {
  const flags = [];
  const occupiedCount = beds.filter((b) => b.status === 'occupied').length;

  beds
    .filter((b) => b.status === 'occupied' && b.markedForDischarge)
    .forEach((bed) => {
      const hrs = (Date.now() - new Date(bed.markedDischargeTime).getTime()) / (1000 * 60 * 60);
      if (hrs > 2) {
        flags.push({
          type: 'warn',
          text: `Transport Delay: Bed ${bed.number} discharged > ${hrs.toFixed(1)} hrs ago.`,
          icon: 'fa-person-walking-arrow-right',
          action: 'Notify Transport',
        });
      }
    });

  beds
    .filter((b) => b.status === 'cleaning')
    .forEach((bed) => {
      if (bed.cleaningStartTime) {
        const mins = (Date.now() - new Date(bed.cleaningStartTime).getTime()) / (1000 * 60);
        if (mins > 30) {
          flags.push({
            type: 'warn',
            text: `EVS Delay: Bed ${bed.number} cleaning > 30 mins.`,
            icon: 'fa-broom',
            action: 'Chase EVS',
          });
        }
      }
    });

  beds
    .filter((b) => b.status === 'occupied' && b.actualLOS > (b.categoryLOS || 99) + 1)
    .forEach((bed) => {
      flags.push({
        type: 'crit',
        text: `Clinical Outlier: ${bed.patientName} (${bed.condition}) Day ${bed.actualLOS}.`,
        icon: 'fa-calendar-xmark',
        action: 'Flag Review',
      });
    });

  const exp = occupiedCount - discharges.length + admissions.length;
  if (exp / WARD_CAPACITY > 0.9) {
    flags.push({
      type: 'crit',
      text: 'Capacity Crunch: Projected > 90% utilization by 4:00 PM.',
      icon: 'fa-triangle-exclamation',
      action: 'Triage Override',
    });
  }

  return flags;
}

function dashboardPayload() {
  return {
    wardCapacity: WARD_CAPACITY,
    beds: JSON.parse(JSON.stringify(beds)),
    discharges: JSON.parse(JSON.stringify(discharges)),
    admissions: JSON.parse(JSON.stringify(admissions)),
    wards: JSON.parse(JSON.stringify(allWards)),
    staff: JSON.parse(JSON.stringify(staffList)),
    escalationFlags: computeEscalations(),
  };
}

const app = express();
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'wardwatch', time: new Date().toISOString() });
});

app.get('/api/dashboard', (req, res) => {
  res.json(dashboardPayload());
});

app.patch('/api/beds/:id', (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body || {};
  const allowed = ['occupied', 'available', 'cleaning', 'reserved', 'send_for_discharge'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const bed = beds.find((b) => b.id === id);
  if (!bed) {
    return res.status(404).json({ error: 'Bed not found' });
  }
  bed.status = status;
  if (status === 'cleaning') {
    bed.cleaningStartTime = new Date().toISOString();
  } else {
    delete bed.cleaningStartTime;
  }
  if (status === 'send_for_discharge') {
    bed.markedForDischarge = true;
    bed.markedDischargeTime = new Date().toISOString();
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
    delete bed.markedDischargeTime;
    delete bed.categoryLOS;
    delete bed.actualLOS;
  }
  res.json({ bed: JSON.parse(JSON.stringify(bed)), dashboard: dashboardPayload() });
});

app.post('/api/queues/discharges/:index/complete', (req, res) => {
  const idx = Number(req.params.index);
  if (idx < 0 || idx >= discharges.length) {
    return res.status(400).json({ error: 'Invalid discharge index' });
  }
  const d = discharges.splice(idx, 1)[0];
  const bed = beds.find((b) => b.number === d.bed);
  if (bed) {
    bed.status = 'cleaning';
    bed.cleaningStartTime = new Date().toISOString();
    delete bed.patientName;
    delete bed.markedForDischarge;
  }
  res.json(dashboardPayload());
});

app.post('/api/queues/admissions/:index/assign', (req, res) => {
  const idx = Number(req.params.index);
  if (idx < 0 || idx >= admissions.length) {
    return res.status(400).json({ error: 'Invalid admission index' });
  }
  const admitted = admissions.splice(idx, 1)[0];
  const avail = beds.find((b) => b.status === 'available' || b.status === 'reserved');
  if (!avail) {
    admissions.push(admitted);
    return res.status(409).json({ error: 'No beds available', dashboard: dashboardPayload() });
  }
  avail.status = 'occupied';
  avail.patientName = admitted.patientName;
  avail.condition = 'Initial Consult';
  avail.doctor = 'TBD';
  avail.admissionDate = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  res.json(dashboardPayload());
});

app.post('/api/beds/:id/signoff', (req, res) => {
  const id = Number(req.params.id);
  const bed = beds.find((b) => b.id === id);
  if (!bed) {
    return res.status(404).json({ error: 'Bed not found' });
  }
  bed.status = 'available';
  delete bed.patientName;
  delete bed.condition;
  delete bed.doctor;
  delete bed.admissionDate;
  delete bed.markedForDischarge;
  delete bed.markedDischargeTime;
  delete bed.categoryLOS;
  delete bed.actualLOS;
  // remove from discharges queue if present
  const dischargeIndex = discharges.findIndex((d) => d.bed === bed.number);
  if (dischargeIndex >= 0) {
    discharges.splice(dischargeIndex, 1);
  }
  res.json(dashboardPayload());
});

app.patch('/api/wards/:index/resolve-staffing', (req, res) => {
  const idx = Number(req.params.index);
  if (idx < 0 || idx >= allWards.length) {
    return res.status(404).json({ error: 'Ward not found' });
  }
  const w = allWards[idx];
  if (!w.shortStaffed) {
    return res.json(dashboardPayload());
  }
  w.shortStaffed = false;
  delete w.neededStaff;
  res.json(dashboardPayload());
});

app.use(express.static(ROOT, { index: ['home.html', 'index.html'] }));

app.listen(PORT, () => {
  console.log(`WardWatch server listening at http://localhost:${PORT}`);
});
