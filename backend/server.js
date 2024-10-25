import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const app = express();
app.use(express.json());
app.use(cors({
  // Vulnerability 6: Insecure CORS Policy, sebaiknya membatasi origin pada domain yang front end yang benar benar punya kita
  // gunakan 
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
}));

// Database connection
const connection = new sqlite3.Database('./db/aplikasi.db');

// Vulnerability 2: SQL Injection sudah diperbaiki dengan menggunakan prepared statement sqlite
app.get('/api/user/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  // Vulnerability 4: userID Validation, memeriksa apakah userId adalah angka valid
  if (isNaN(userId)) {
    return res.status(400).send('Invalid user ID');
  }

  const query = `SELECT * FROM users WHERE id = ?`;
  connection.all(query, [userId], (error, results) => {
    if (error) {
      console.error('Database error:', error);
      return res.status(500).send('Internal Server Error');
    }
    res.json(results);
  });
});

// Vulnerability 5: Rate Limiting, membatasi jumlah request POST untuk mencegah brute force
const changeEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5, // Maksimal 5 kali percobaan
  message: 'Terlalu banyak percobaan, coba lagi nanti.',
});

app.post('/api/user/:id/change-email', changeEmailLimiter, (req, res) => {
  const newEmail = req.body.email;
  const userId = parseInt(req.params.id);

  // Vulnerability 4: userID Validation, memeriksa apakah userId adalah angka valid
  if (isNaN(userId)) {
    return res.status(400).send('Invalid user ID');
  }

  // Vulnerability 3: Email Validation, memeriksa apakah newEmail adalah email yang valid menggunakan regex sederhana
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmail)) {
    return res.status(400).send('Invalid email format');
  }

  const query = `UPDATE users SET email = ? WHERE id = ?`;
  connection.run(query, [newEmail, userId], function (err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Internal Server Error');
    }
    if (this.changes === 0) res.status(404).send('User not found');
    else res.status(200).send('Email updated successfully');
  });
});

// Vulnerability 7: File Path Security, validasi nama file untuk mencegah path traversal attack
app.get('/api/file', (req, res) => {
  const __filename = fileURLToPath(import.meta.url); 
  const __dirname = path.dirname(__filename); 

  const fileName = req.query.name;
  // Memeriksa apakah fileName hanya mengandung karakter yang valid untuk nama file
  if (!/^[a-zA-Z0-9._-]+$/.test(fileName)) {
    return res.status(400).send('Invalid file name');
  }

  const filePath = path.join(__dirname, 'files', fileName);
  // Memastikan bahwa file tersebut berada dalam direktori 'files' yang diizinkan
  if (!filePath.startsWith(path.join(__dirname, 'files'))) {
    return res.status(403).send('Access denied');
  }

  res.sendFile(filePath);
});

// Menambahkan middleware untuk memeriksa Content-Type pada POST requests
app.use((req, res, next) => {
  if (req.method === 'POST' && !req.is('application/json')) {
    return res.status(415).send('Content-Type must be application/json');
  }
  next();
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
