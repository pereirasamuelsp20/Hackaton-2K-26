import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Register/Add Member Route
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  const prisma = req.prisma;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const user = await prisma.user.create({
      data: { name, email, password, role }
    });

    res.status(201).json({ message: 'User created successfully', user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const prisma = req.prisma;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'supersecretjwtkey',
      { expiresIn: '1d' }
    );

    return res.json({
      token,
      role: user.role,
      email: user.email,
      name: user.name
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Authentication failed.' });
  }
});

// Get All Staff Route
router.get('/staff', async (req, res) => {
  const prisma = req.prisma;
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true }
    });
    res.json(users);
  } catch (err) {
    console.error('Fetch staff error:', err);
    res.status(500).json({ error: 'Failed to fetch staff members.' });
  }
});

export default router;
