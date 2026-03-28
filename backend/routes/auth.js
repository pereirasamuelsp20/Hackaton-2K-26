import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Hardcoded Credentials
const USERS = {
  'Administrator': { email: '225samuel0032@dbit.in', password: '12345', name: 'Admin Samuel' },
  'Doctor': { email: '225ananya0117@dbit.in', password: '12345', name: 'Dr. Ananya' },
  'Nurse': { email: '225siddhi0091@dbit.in', password: '12345', name: 'Nurse Siddhi' },
  'Cleaning Staff': { email: 'adityatol18@gmail.com', password: '12345', name: 'Cleaner Aditya' }
};

router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  const validUser = USERS[role];

  if (!validUser) {
    return res.status(401).json({ error: 'Invalid role selected.' });
  }

  if (email === validUser.email && password === validUser.password) {
    const token = jwt.sign({ role, email }, process.env.JWT_SECRET || 'supersecretjwtkey', { expiresIn: '1d' });
    return res.json({ token, role, email, name: validUser.name });
  }

  return res.status(401).json({ error: 'Invalid email or password for the selected role.' });
});

export default router;
