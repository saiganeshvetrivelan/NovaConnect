const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyAuth } = require('../middleware/auth');

// Get courses for current user
router.get('/', verifyAuth, async (req, res) => {
    try {
        const include = {
            faculty: { select: { name: true } },
            forums: { select: { id: true, topic: true } },
            _count: { select: { enrollments: true } }
        };
        if (req.user.role === 'Student') {
            const enrollments = await prisma.enrollment.findMany({
                where: { student_id: req.user.id },
                include: { course: { include } }
            });
            return res.json(enrollments.map(e => ({ ...e.course, enrolled: e.course._count.enrollments })));
        } else if (req.user.role === 'Faculty') {
            const courses = await prisma.course.findMany({
                where: { faculty_id: req.user.id },
                include
            });
            return res.json(courses.map(c => ({ ...c, enrolled: c._count.enrollments })));
        } else {
            const courses = await prisma.course.findMany({ include });
            return res.json(courses.map(c => ({ ...c, enrolled: c._count.enrollments })));
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get a single course by ID
router.get('/:id', verifyAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const course = await prisma.course.findUnique({
            where: { id },
            include: {
                faculty: { select: { name: true, email: true } },
                forums: { select: { id: true, topic: true, description: true } },
                _count: { select: { enrollments: true, assignments: true, resources: true } }
            }
        });
        if (!course) return res.status(404).json({ error: 'Course not found' });
        res.json({ ...course, enrolled: course._count.enrollments });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;

