const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyAuth, verifyRole } = require('../middleware/auth');

// Create assignment
router.post('/create', verifyAuth, verifyRole(['Faculty', 'Admin']), async (req, res) => {
    try {
        const { course_id, title, description, deadline } = req.body;
        
        const assignment = await prisma.assignment.create({
            data: {
                course_id,
                created_by: req.user.id,
                title,
                description,
                deadline: new Date(deadline)
            }
        });
        res.status(201).json(assignment);
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Submit assignment
router.post('/submit', verifyAuth, verifyRole(['Student']), async (req, res) => {
    try {
        const { assignment_id, file_url } = req.body;
        
        const submission = await prisma.submission.create({
            data: {
                assignment_id,
                student_id: req.user.id,
                file_url
            }
        });
        
        // TODO: Call Python AI Microservice async for similarity check here

        res.status(201).json(submission);
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get assignments for matching courses
router.get('/', verifyAuth, async (req, res) => {
    try {
        let courseIds = [];
        if (req.user.role === 'Student') {
            const enrollments = await prisma.enrollment.findMany({ where: { student_id: req.user.id } });
            courseIds = enrollments.map(e => e.course_id);
        } else if (req.user.role === 'Faculty') {
            const courses = await prisma.course.findMany({ where: { faculty_id: req.user.id } });
            courseIds = courses.map(c => c.id);
        }
        
        const assignments = await prisma.assignment.findMany({
            where: { course_id: { in: courseIds } },
            include: { course: { select: { course_code: true } } },
            orderBy: { deadline: 'asc' }
        });
        
        res.json(assignments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get all submissions (Faculty sees all, Student sees own)
router.get('/submissions', verifyAuth, async (req, res) => {
    try {
        if (req.user.role === 'Faculty') {
            const courses = await prisma.course.findMany({ where: { faculty_id: req.user.id } });
            const courseIds = courses.map(c => c.id);
            const assignments = await prisma.assignment.findMany({ where: { course_id: { in: courseIds } } });
            const assignmentIds = assignments.map(a => a.id);
            const submissions = await prisma.submission.findMany({
                where: { assignment_id: { in: assignmentIds } },
                include: {
                    student: { select: { name: true, email: true, roll_number: true } },
                    assignment: { select: { title: true, deadline: true } }
                },
                orderBy: { submitted_at: 'desc' }
            });
            return res.json(submissions);
        } else {
            const submissions = await prisma.submission.findMany({
                where: { student_id: req.user.id },
                include: { assignment: { select: { title: true, deadline: true } } },
                orderBy: { submitted_at: 'desc' }
            });
            return res.json(submissions);
        }
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Grade a submission (Faculty only)
router.post('/grade', verifyAuth, verifyRole(['Faculty', 'Admin']), async (req, res) => {
    try {
        const { submission_id, grade, feedback } = req.body;
        const updated = await prisma.submission.update({
            where: { id: submission_id },
            data: { grade: grade.toString(), feedback }
        });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
