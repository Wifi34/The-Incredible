import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { authenticateToken, JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

// 1. Citizen Registration (Public)
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword, address, city, wardId, avatar } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields (Name, Email, Password)' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const existingUser = db.findUserByEmail(cleanEmail);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists. Please log in.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Enforce CITIZEN role strictly for public registration
    const newUser = db.addUser({
      name: name.trim(),
      email: cleanEmail,
      phone: (phone || '+91 98765 00000').trim(),
      passwordHash,
      role: 'CITIZEN',
      address: address ? address.trim() : '',
      city: city || 'Pune',
      wardId: wardId || 'ward_12',
      coins: 50,
      avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Audit log
    db.addAuditLog({
      userId: newUser.id,
      userName: newUser.name,
      userRole: newUser.role,
      action: 'USER_REGISTERED',
      targetType: 'USER',
      targetId: newUser.id,
      details: `Citizen ${newUser.name} registered account in ward ${newUser.wardId}.`
    });

    const { passwordHash: _, ...safeUser } = newUser;
    safeUser.coins = safeUser.coins || 50;
    safeUser.convertedRupees = Math.floor((safeUser.coins / 200) * 5);

    return res.status(201).json({
      success: true,
      message: 'Citizen registration successful! Welcome to CivicSense.',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Registration server error:', err);
    return res.status(500).json({ success: false, message: 'Registration failed: ' + err.message, error: err.message });
  }
});

// 2. User Login (All Roles)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter both email and password' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.findUserByEmail(cleanEmail);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. No user found with this email.' });
    }

    let isMatch = false;
    if (user.passwordHash) {
      isMatch = await bcrypt.compare(password, user.passwordHash);
    }
    if (!isMatch && user.password) {
      isMatch = (password === user.password);
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password. Please check your credentials.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Record audit log
    db.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'USER_LOGIN',
      targetType: 'USER',
      targetId: user.id,
      details: `${user.role} ${user.name} logged into CivicSense platform.`
    });

    const { passwordHash: _, ...safeUser } = user;
    safeUser.coins = safeUser.coins || 0;
    safeUser.convertedRupees = Math.floor((safeUser.coins / 200) * 5);

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Login server error:', err);
    return res.status(500).json({ success: false, message: 'Login failed: ' + err.message, error: err.message });
  }
});

// 3. Current User
router.get('/me', authenticateToken, (req, res) => {
  const { passwordHash: _, ...safeUser } = req.user;
  safeUser.coins = safeUser.coins || 0;
  safeUser.convertedRupees = Math.floor((safeUser.coins / 200) * 5);
  res.json({ success: true, user: safeUser });
});

// 4. Meta Data (Categories, Wards, Departments, Teams)
router.get('/meta', (req, res) => {
  res.json({
    success: true,
    categories: db.issueCategories,
    wards: db.wards,
    departments: db.departments,
    teams: db.teams
  });
});

export default router;
