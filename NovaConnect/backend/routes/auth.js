const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'novaconnect_demo_secret_2026';

router.post('/login', async (req, res) => {
    try {
        const { email, password, roll_number } = req.body;
        
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.roll_number !== roll_number) {
            return res.status(401).json({ error: "Invalid credentials. Check Email and Roll Number." });
        }
        
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials. Incorrect password." });
        }
        
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
        
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, roll_number: user.roll_number } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get('/me', require('../middleware/auth').verifyAuth, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, name: true, email: true, role: true, roll_number: true, department: true }
        });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
