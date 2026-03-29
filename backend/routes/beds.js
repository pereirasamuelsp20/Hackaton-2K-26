import express from 'express';

const router = express.Router();

router.put('/:id/status', async (req, res) => {
  const { prisma, io } = req;
  const bedId = parseInt(req.params.id);
  const { status } = req.body;

  try {
    const bed = await prisma.bed.update({
      where: { id: bedId },
      data: { status }
    });

    // Make sure we broadcast the change
    io.emit('bedUpdate', { bedId, status });
    if (status === 'AVAILABLE') {
      io.emit('notification', {
        type: 'BED_AVAILABLE',
        message: `Bed ${bed.number} has been sanitized and is now available for admission`,
        targetRoles: ['DOCTOR', 'NURSE', 'ADMIN', 'ADMINISTRATOR']
      });
    } else {
      io.emit('notification', {
        type: 'CLEANING',
        message: `Bed ${bed.number} is now ${status.replace('_', ' ')}`
      });
    }

    await prisma.log.create({
      data: {
        action: 'UPDATE_BED_STATUS',
        details: `Bed ${bedId} changed status to ${status}`
      }
    });

    res.json(bed);
  } catch (error) {
    console.error("Bed update error", error);
    res.status(500).json({ error: "Failed to update bed status" });
  }
});

// Admin endpoint to assign a patient to a bed explicitly
router.post('/:id/assign', async (req, res) => {
  const { prisma, io } = req;
  const bedId = parseInt(req.params.id);
  const { patientId } = req.body;

  try {
    const patient = await prisma.patient.update({
      where: { id: patientId },
      data: { bedId }
    });
    const bed = await prisma.bed.update({
      where: { id: bedId },
      data: { status: 'OCCUPIED' }
    });
    
    io.emit('bedUpdate', { bedId, status: 'OCCUPIED' });
    io.emit('patientAssigned', { bedId, patientId });
    res.json({ bed, patient });
  } catch (error) {
    console.error("Assign patient error", error);
    res.status(500).json({ error: "Failed to assign patient" });
  }
});

export default router;
