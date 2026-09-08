const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create new user (Student or Faculty)
router.post('/users/create', async (req, res) => {
    try {
        const { name, email, password, role, roll_number, department } = req.body;
        
        if (!email.endsWith('@srec.ac.in') && role !== 'Admin') {
            return res.status(400).json({ error: "Must use a valid institutional email (@srec.ac.in)" });
        }

        const existingEmail = await prisma.user.findUnique({ where: { email } });
        if (existingEmail) return res.status(400).json({ error: "Email already registered" });
        
        const existingRoll = await prisma.user.findUnique({ where: { roll_number } });
        if (existingRoll) return res.status(400).json({ error: "Roll Number already registered" });

        const password_hash = await bcrypt.hash(password, 10);
        
        const user = await prisma.user.create({
            data: { name, email, roll_number, password_hash, role, department }
        });
        
        res.status(201).json({ message: "User created successfully", user: { id: user.id, name: user.name, role: user.role } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// List all users
router.get('/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true, roll_number: true, email: true, role: true, department: true }
        });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Update user
router.put('/users/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name, email, role, roll_number, department } = req.body;
        
        const user = await prisma.user.update({
            where: { id },
            data: { name, email, role, roll_number, department }
        });
        res.json({ message: "User updated successfully", user: { id: user.id, name: user.name } });
    } catch (err) {
        console.error(err);
        if (err.code === 'P2025') return res.status(404).json({ error: "User not found" });
        if (err.code === 'P2002') return res.status(400).json({ error: "Email or Roll Number already in use" });
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await prisma.user.delete({ where: { id } });
        res.json({ message: "User deleted successfully" });
    } catch (err) {
        console.error(err);
        if (err.code === 'P2025') return res.status(404).json({ error: "User not found" });
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
