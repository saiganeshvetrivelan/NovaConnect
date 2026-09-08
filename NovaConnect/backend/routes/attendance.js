const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyAuth, verifyRole } = require('../middleware/auth');

// Mark attendance
router.post('/mark', verifyAuth, verifyRole(['Faculty', 'Admin']), async (req, res) => {
    try {
        const { course_id, student_id, date, status } = req.body;
        
        const attendance = await prisma.attendance.create({
            data: {
                course_id,
                student_id,
                date: new Date(date),
                status
            }
        });
        
        res.status(201).json(attendance);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get attendance
router.get('/', verifyAuth, async (req, res) => {
    try {
        if (req.user.role === 'Student') {
            const records = await prisma.attendance.findMany({
                where: { student_id: req.user.id },
                include: { course: { select: { course_code: true, name: true } } },
                orderBy: { date: 'desc' }
            });
            return res.json(records);
        } else {
            // Faculty / Admin
            const course_id = parseInt(req.query.course_id);
            if (!course_id) return res.status(400).json({ error: "course_id query required" });
            const records = await prisma.attendance.findMany({
                where: { course_id },
                include: { student: { select: { name: true, email: true, roll_number: true } } },
                orderBy: { date: 'desc' }
            });
            return res.json(records);
        }
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get students enrolled in a course (for faculty to mark attendance)
router.get('/students/:course_id', verifyAuth, verifyRole(['Faculty', 'Admin']), async (req, res) => {
    try {
        const course_id = parseInt(req.params.course_id);
        const enrollments = await prisma.enrollment.findMany({
            where: { course_id },
            include: { student: { select: { id: true, name: true, email: true, roll_number: true } } }
        });
        const students = enrollments.map(e => e.student);
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
