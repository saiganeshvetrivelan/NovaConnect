const express = require('express');
const router = express.Router();
const multer  = require('multer');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyAuth, verifyRole } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname)
    }
});
const upload = multer({ storage: storage });

// Upload a resource
router.post('/upload', verifyAuth, verifyRole(['Faculty', 'Admin']), upload.single('file'), async (req, res) => {
    try {
        const { course_id, title } = req.body;
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const resource = await prisma.resource.create({
            data: {
                course_id: parseInt(course_id),
                uploaded_by: req.user.id,
                title,
                file_url: `/uploads/${req.file.filename}`,
                file_type: req.file.mimetype
            }
        });

        res.status(201).json(resource);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get resources for a course
router.get('/:course_id', verifyAuth, async (req, res) => {
    try {
        const resources = await prisma.resource.findMany({
            where: { course_id: parseInt(req.params.course_id) },
            include: { user: { select: { name: true } } },
            orderBy: { uploaded_at: 'desc' }
        });
        res.json(resources);
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
