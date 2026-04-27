import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { get, run, query } from './db.js';

const app = express();
const PORT = 5000;
const JWT_SECRET = 'meshpay_secret_key_123';

app.use(cors());
app.use(express.json());

// Middleware to protect routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

/** AUTH ROUTES **/

// Login or auto-register logic
app.post('/api/auth/login', async (req, res) => {
  const { phone, pin } = req.body;

  if (phone !== '8098719903' || pin !== '2802') {
    return res.status(401).json({ message: 'Invalid credentials. Use 8098719903 / 2802' });
  }

  try {
    let user = await get("SELECT * FROM users WHERE phone = ?", [phone]);

    if (!user) {
      // Auto-register new user
      const hashedPassword = bcrypt.hashSync(pin, 10);
      const result = await run(
        "INSERT INTO users (phone, pin, name, balance) VALUES (?, ?, ?, ?)",
        [phone, hashedPassword, `User ${phone.slice(-4)}`, 5000.00]
      );
      user = { id: result.id, phone, name: `User ${phone.slice(-4)}`, balance: 5000.00 };
    } else {
      // Validate PIN
      const validPin = bcrypt.compareSync(pin, user.pin);
      if (!validPin) {
        return res.status(401).json({ message: 'Invalid PIN' });
      }
    }

    const token = jwt.sign({ id: user.id, phone: user.phone }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ 
      token, 
      user: { id: user.id, phone: user.phone, name: user.name, balance: user.balance } 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/** USER & TRANSACTION ROUTES **/

app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await get("SELECT id, phone, name, balance FROM users WHERE id = ?", [req.user.id]);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const txs = await query(
      "SELECT * FROM transactions WHERE sender_id = ? OR receiver_phone = ? ORDER BY timestamp DESC",
      [req.user.id, req.user.phone]
    );
    res.json(txs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/pay', authenticateToken, async (req, res) => {
  const { receiverPhone, amount, method } = req.body;

  try {
    const sender = await get("SELECT balance FROM users WHERE id = ?", [req.user.id]);
    
    if (sender.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Begin atomic transaction manually since we're using run
    await run("UPDATE users SET balance = balance - ? WHERE id = ?", [amount, req.user.id]);
    
    // If receiver exists, update their balance too
    const receiver = await get("SELECT id FROM users WHERE phone = ?", [receiverPhone]);
    if (receiver) {
      await run("UPDATE users SET balance = balance + ? WHERE id = ?", [amount, receiver.id]);
    }

    const result = await run(
      "INSERT INTO transactions (sender_id, receiver_phone, amount, status, method) VALUES (?, ?, ?, ?, ?)",
      [req.user.id, receiverPhone, amount, 'completed', method || 'Online']
    );

    res.json({ message: 'Payment successful', transactionId: result.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
