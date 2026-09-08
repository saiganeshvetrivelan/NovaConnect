const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyAuth } = require('../middleware/auth');

// Send a direct or course message
router.post('/send', verifyAuth, async (req, res) => {
    try {
        const { receiver_id, course_id, content } = req.body;
        
        const msg = await prisma.message.create({
            data: {
                sender_id: req.user.id,
                receiver_id: receiver_id || null,
                course_id: course_id || null,
                content
            }
        });
        res.status(201).json(msg);
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get incoming messages
router.get('/inbox', verifyAuth, async (req, res) => {
    try {
        const msgs = await prisma.message.findMany({
            where: { receiver_id: req.user.id },
            include: { sender: { select: { name: true, email: true, role: true } } },
            orderBy: { timestamp: 'desc' }
        });
        res.json(msgs);
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get sent messages
router.get('/sent', verifyAuth, async (req, res) => {
    try {
        const msgs = await prisma.message.findMany({
            where: { sender_id: req.user.id, receiver_id: { not: null } },
            include: { receiver: { select: { name: true, email: true, role: true } } },
            orderBy: { timestamp: 'desc' }
        });
        res.json(msgs);
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get all users for composing messages
router.get('/users', verifyAuth, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            where: { id: { not: req.user.id } },
            select: { id: true, name: true, email: true, role: true, roll_number: true }
        });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
