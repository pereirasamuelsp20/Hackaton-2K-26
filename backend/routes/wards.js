import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
  const { prisma } = req;
  try {
    const wards = await prisma.ward.findMany({
      include: {
        beds: {
          include: {
            patient: true,
          }
        },
      },
    });

    const parsedWards = wards.map(ward => {
      const stats = {
        total: ward.capacity,
        available: ward.beds.filter(b => b.status === 'AVAILABLE').length,
        occupied: ward.beds.filter(b => b.status === 'OCCUPIED').length,
        reserved: ward.beds.filter(b => b.status === 'RESERVED').length,
        cleaning: ward.beds.filter(b => b.status === 'NEEDS_CLEANING' || b.status === 'IN_CLEANING').length
      };
      return { ...ward, stats };
    });

    res.json(parsedWards);
  } catch (error) {
    console.error("Ward fetch error", error);
    res.status(500).json({ error: "Failed to fetch wards" });
  }
});

router.get('/:id/beds', async (req, res) => {
  const { prisma } = req;
  const wardId = parseInt(req.params.id);
  try {
    const beds = await prisma.bed.findMany({
      where: { wardId },
      include: {
        patient: true
      }
    });
    res.json(beds);
  } catch (error) {
    console.error("Beds fetch error", error);
    res.status(500).json({ error: "Failed to fetch beds" });
  }
});

export default router;
