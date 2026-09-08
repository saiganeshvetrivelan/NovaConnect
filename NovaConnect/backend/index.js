const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const prisma = new PrismaClient();

// ─── Socket.io setup ───────────────────────────────────────────────────────────
const io = new Server(httpServer, {
    cors: {
        origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
        methods: ['GET', 'POST']
    }
});

// Attach io instance to req so REST routes can emit events
app.set('io', io);

// Auth middleware for socket connections
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
    } catch (e) {
        next(new Error('Invalid token'));
    }
});

io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.user?.name} (${socket.id})`);

    // Join a forum room
    socket.on('join_forum', (forumId) => {
        const room = `forum_${forumId}`;
        socket.join(room);
        console.log(`${socket.user?.name} joined room ${room}`);
        // Broadcast current online count to room
        const count = io.sockets.adapter.rooms.get(room)?.size || 0;
        io.to(room).emit('online_count', count);
    });

    // Leave a forum room
    socket.on('leave_forum', (forumId) => {
        const room = `forum_${forumId}`;
        socket.leave(room);
        const count = io.sockets.adapter.rooms.get(room)?.size || 0;
        io.to(room).emit('online_count', count);
    });

    // Send message via socket (saves to DB + broadcasts)
    socket.on('send_message', async (data) => {
        try {
            const { forum_id, course_id, message_text, ai_category, reply_to_id } = data;
            if (!forum_id || !course_id || !message_text?.trim()) return;

            const msg = await prisma.forumMessage.create({
                data: {
                    forum_id: parseInt(forum_id),
                    course_id: parseInt(course_id),
                    sender_id: socket.user.id,
                    message_text: message_text.trim(),
                    ai_category: ai_category || 'General',
                    reply_to_id: reply_to_id ? parseInt(reply_to_id) : null
                },
                include: {
                    sender: { select: { id: true, name: true, role: true, roll_number: true } },
                    reply_to: {
                        include: { sender: { select: { id: true, name: true, role: true } } }
                    }
                }
            });

            // Broadcast to all in the room
            io.to(`forum_${forum_id}`).emit('new_message', msg);
        } catch (err) {
            console.error('Socket send_message error:', err);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    // Faculty: delete message
    socket.on('delete_message', async (data) => {
        try {
            if (!['Faculty', 'Admin'].includes(socket.user?.role)) return;
            const { id, forum_id } = data;
            await prisma.forumMessage.update({ where: { id: parseInt(id) }, data: { is_deleted: true } });
            io.to(`forum_${forum_id}`).emit('message_deleted', { id: parseInt(id) });
        } catch (err) {
            console.error('Socket delete_message error:', err);
        }
    });

    // Faculty: pin/unpin message
    socket.on('pin_message', async (data) => {
        try {
            if (!['Faculty', 'Admin'].includes(socket.user?.role)) return;
            const { id, forum_id } = data;
            const msg = await prisma.forumMessage.findUnique({ where: { id: parseInt(id) } });
            if (!msg) return;
            const updated = await prisma.forumMessage.update({
                where: { id: parseInt(id) },
                data: { is_pinned: !msg.is_pinned },
                include: { sender: { select: { id: true, name: true, role: true } } }
            });
            io.to(`forum_${forum_id}`).emit('message_pinned', updated);
        } catch (err) {
            console.error('Socket pin_message error:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log(`🔴 Socket disconnected: ${socket.user?.name}`);
    });
});

// ─── Express middleware ────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Routes ────────────────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const forumRoutes = require('./routes/forum');
const forumMessagesRoutes = require('./routes/forum_messages');
const messagingRoutes = require('./routes/messaging');
const assignmentRoutes = require('./routes/assignment');
const attendanceRoutes = require('./routes/attendance');
const courseRoutes = require('./routes/course');
const resourceRoutes = require('./routes/resource');
const adminRoutes = require('./routes/admin');
const { requireAdmin } = require('./middleware/rbac');
const { verifyAuth } = require('./middleware/auth');
const path = require('path');

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth', authRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/forum-messages', forumMessagesRoutes);
app.use('/api/messages', messagingRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/admin', verifyAuth, requireAdmin, adminRoutes);

// ─── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`✅ NovaConnect Backend + Socket.io running on port ${PORT}`);
});
