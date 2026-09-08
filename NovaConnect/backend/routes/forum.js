const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyAuth } = require('../middleware/auth');

// Create a new forum inside a course
router.post('/create', verifyAuth, async (req, res) => {
    try {
        const { course_id, topic, description } = req.body;
        
        const forum = await prisma.forum.create({
            data: { course_id, topic, description }
        });

        res.status(201).json(forum);
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get all forums accessible to the current user
router.get('/all', verifyAuth, async (req, res) => {
    try {
        let courseIds = null;
        if (req.user.role === 'Student') {
            const enrollments = await prisma.enrollment.findMany({ where: { student_id: req.user.id } });
            courseIds = enrollments.map(e => e.course_id);
        } else if (req.user.role === 'Faculty') {
            const courses = await prisma.course.findMany({ where: { faculty_id: req.user.id } });
            courseIds = courses.map(c => c.id);
        }
        const forums = await prisma.forum.findMany({
            where: courseIds !== null ? { course_id: { in: courseIds } } : {},
            include: { course: { select: { id: true, course_code: true, course_name: true } } },
            orderBy: { created_at: 'desc' }
        });
        res.json(forums);
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Post a question/reply
router.post('/post', verifyAuth, async (req, res) => {
    try {
        const { forum_id, content, parent_post_id } = req.body;
        
        const post = await prisma.forumPost.create({
            data: {
                forum_id,
                user_id: req.user.id,
                content,
                parent_post_id: parent_post_id || null
            }
        });

        res.status(201).json(post);
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get posts for a forum
router.get('/:forum_id/posts', verifyAuth, async (req, res) => {
    try {
        const posts = await prisma.forumPost.findMany({
            where: { forum_id: parseInt(req.params.forum_id) },
            include: { user: { select: { name: true, role: true } } },
            orderBy: { created_at: 'asc' }
        });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
