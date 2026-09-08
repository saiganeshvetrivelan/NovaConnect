const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyAuth, verifyRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, '../uploads/forum');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

const MESSAGE_INCLUDE = {
    sender: { select: { id: true, name: true, role: true, roll_number: true } },
    reply_to: {
        include: { sender: { select: { id: true, name: true, role: true } } }
    },
    replies: {
        where: { is_deleted: false },
        include: { sender: { select: { id: true, name: true, role: true } } },
        orderBy: { created_at: 'asc' }
    }
};

// GET /api/forum-messages/recent — get latest messages for dashboard
router.get('/recent', verifyAuth, async (req, res) => {
    try {
        let courseIds = [];
        if (req.user.role === 'Student') {
            const enrollments = await prisma.enrollment.findMany({ where: { student_id: req.user.id } });
            courseIds = enrollments.map(e => e.course_id);
        } else if (req.user.role === 'Faculty') {
            const courses = await prisma.course.findMany({ where: { faculty_id: req.user.id } });
            courseIds = courses.map(c => c.id);
        } else {
            const courses = await prisma.course.findMany();
            courseIds = courses.map(c => c.id);
        }

        const recentMessages = await prisma.forumMessage.findMany({
            where: { course_id: { in: courseIds }, is_deleted: false },
            include: { sender: { select: { name: true } }, course: { select: { course_name: true, course_code: true } } },
            orderBy: { created_at: 'desc' },
            take: 5
        });
        
        res.json(recentMessages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/forum-messages/:forum_id — load history (last 100)
router.get('/:forum_id', verifyAuth, async (req, res) => {
    try {
        const forum_id = parseInt(req.params.forum_id);
        const messages = await prisma.forumMessage.findMany({
            where: { forum_id, is_deleted: false, reply_to_id: null },
            include: MESSAGE_INCLUDE,
            orderBy: { created_at: 'asc' },
            take: 100
        });
        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/forum-messages — save a new message (also emitted via Socket.io in index.js)
router.post('/', verifyAuth, async (req, res) => {
    try {
        const { forum_id, course_id, message_text, ai_category, reply_to_id } = req.body;
        if (!forum_id || !course_id || !message_text?.trim()) {
            return res.status(400).json({ error: 'forum_id, course_id and message_text are required' });
        }
        const msg = await prisma.forumMessage.create({
            data: {
                forum_id: parseInt(forum_id),
                course_id: parseInt(course_id),
                sender_id: req.user.id,
                message_text: message_text.trim(),
                ai_category: ai_category || 'General',
                reply_to_id: reply_to_id ? parseInt(reply_to_id) : null
            },
            include: MESSAGE_INCLUDE
        });
        res.status(201).json(msg);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/forum-messages/upload — file attachment
router.post('/upload', verifyAuth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const { forum_id, course_id, reply_to_id } = req.body;

        const attachment_url = `/uploads/forum/${req.file.filename}`;
        const attachment_name = req.file.originalname;

        const msg = await prisma.forumMessage.create({
            data: {
                forum_id: parseInt(forum_id),
                course_id: parseInt(course_id),
                sender_id: req.user.id,
                message_text: attachment_name,
                ai_category: 'File',
                attachment_url,
                attachment_name,
                reply_to_id: reply_to_id ? parseInt(reply_to_id) : null
            },
            include: MESSAGE_INCLUDE
        });
        res.status(201).json(msg);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE /api/forum-messages/:id — faculty/admin only (soft delete)
router.delete('/:id', verifyAuth, verifyRole(['Faculty', 'Admin']), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await prisma.forumMessage.update({
            where: { id },
            data: { is_deleted: true }
        });
        res.json({ success: true, id });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PATCH /api/forum-messages/:id/pin — faculty/admin toggle pin
router.patch('/:id/pin', verifyAuth, verifyRole(['Faculty', 'Admin']), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const msg = await prisma.forumMessage.findUnique({ where: { id } });
        if (!msg) return res.status(404).json({ error: 'Not found' });
        const updated = await prisma.forumMessage.update({
            where: { id },
            data: { is_pinned: !msg.is_pinned },
            include: MESSAGE_INCLUDE
        });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
