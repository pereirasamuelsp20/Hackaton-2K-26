import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
  const { prisma } = req;
  try {
    const patients = await prisma.patient.findMany({
      include: {
        bed: {
          include: {
            ward: true
          }
        },
        assignedDoctor: true
      }
    });
    res.json(patients);
  } catch (error) {
    console.error("Patient fetch error", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

router.post('/', async (req, res) => {
  const { prisma, io } = req;
  const { name, age, dob, gender, diagnosis, allergies, history, medication, admissionDate, wardId } = req.body;
  
  try {
    // 1. Find an available bed (prioritize wardId if provided)
    let availableBed = null;
    if (wardId) {
      availableBed = await prisma.bed.findFirst({
        where: { status: 'AVAILABLE', wardId: parseInt(wardId) }
      });
    }

    if (!availableBed) {
      availableBed = await prisma.bed.findFirst({
        where: { status: 'AVAILABLE' }
      });
    }

    if (!availableBed) {
      return res.status(400).json({ error: "No beds available in the requested ward or system-wide." });
    }

    // 2. Find a random doctor
    const doctors = await prisma.user.findMany({
      where: { role: 'DOCTOR' }
    });

    let assignedDoctorId = null;
    if (doctors.length > 0) {
        const randomDoctor = doctors[Math.floor(Math.random() * doctors.length)];
        assignedDoctorId = randomDoctor.id;
    }

    // 3. Create the patient
    const patientData = {
        name,
        age: parseInt(age),
        dob: dob || '',
        gender,
        diagnosis,
        allergies: allergies || 'None',
        history,
        medication,
        admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
        bedId: availableBed.id,
        assignedDoctorId
    };

    const patient = await prisma.patient.create({ data: patientData });

    // 4. Update bed status
    await prisma.bed.update({
        where: { id: availableBed.id },
        data: { status: 'OCCUPIED' }
    });

    io.emit('patientCreated', patient);
    io.emit('bedUpdate', { bedId: availableBed.id, status: 'OCCUPIED' });
    
    io.emit('notification', {
        type: 'ADMISSION',
        message: `Patient ${patient.name} admitted to Bed ${availableBed.number}`
    });

    res.json(patient);
  } catch (error) {
    console.error("Patient create error:", error);
    res.status(500).json({ 
      error: "Failed to create patient", 
      details: error.message,
      stack: error.stack 
    });
  }
});

router.put('/:id/request-review', async (req, res) => {
  const { prisma, io } = req;
  const patientId = parseInt(req.params.id);

  try {
    const patient = await prisma.patient.update({
      where: { id: patientId },
      data: { adminReviewRequested: true },
      include: { assignedDoctor: true }
    });
    
    io.emit('patientUpdated', patient);
    if (patient.assignedDoctor) {
        io.emit('notification', {
            type: 'ADMIN',
            message: `Admin requested discharge review for patient ${patient.name} from Dr. ${patient.assignedDoctor.name}`
        });
    }
    
    res.json({ success: true, patient });
  } catch (error) {
    console.error("Request review error", error);
    res.status(500).json({ error: "Failed to request review" });
  }
});

router.post('/:id/discharge', async (req, res) => {
  const { prisma, io } = req;
  const patientId = parseInt(req.params.id);

  try {
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient || !patient.bedId) {
      return res.status(400).json({ error: "Patient not found or already discharged" });
    }

    const bedId = patient.bedId;

    // Disconnect bed
    await prisma.patient.update({
      where: { id: patientId },
      data: { bedId: null }
    });

    const bed = await prisma.bed.update({
      where: { id: bedId },
      data: { status: 'NEEDS_CLEANING' }
    });

    // Mock n8n trigger
    // if (process.env.N8N_WEBHOOK_URL) {
    //   await fetch(process.env.N8N_WEBHOOK_URL, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ patientId, action: 'DISCHARGE', email: '225samuel0032@dbit.in' })
    //   });
    // }

    // Emit updates
    io.emit('patientDischarged', { patientId, bedId });
    io.emit('bedUpdate', { bedId, status: 'NEEDS_CLEANING' });
    
    // Notifications
    io.emit('notification', {
      type: 'CLEANING',
      message: `Bed ${bed.number} is ready for cleaning`
    });
    io.emit('notification', {
      type: 'ADMIN',
      message: `Patient ${patient.name} discharged from Bed ${bed.number}`
    });

    await prisma.log.create({
      data: {
        action: 'PATIENT_DISCHARGE',
        details: `Discharged patient ${patient.name} from bed ${bed.number}`
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Discharge error", error);
    res.status(500).json({ error: "Failed to discharge patient" });
  }
});

export default router;
