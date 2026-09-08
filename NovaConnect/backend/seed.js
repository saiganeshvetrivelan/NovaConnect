const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function seed() {
    console.log("Starting DB seeding...");

    // Clean up (order matters due to foreign keys)
    await prisma.submission.deleteMany({});
    await prisma.attendance.deleteMany({});
    await prisma.assignment.deleteMany({});
    await prisma.forumPost.deleteMany({});
    await prisma.forum.deleteMany({});
    await prisma.message.deleteMany({});
    await prisma.resource.deleteMany({});
    await prisma.enrollment.deleteMany({});
    await prisma.course.deleteMany({});
    await prisma.user.deleteMany({});

    const password_hash = await bcrypt.hash('password123', 10);
    const admin_hash = await bcrypt.hash('admin123', 10);

    // Create Admin
    const admin = await prisma.user.create({
        data: { name: "System Administrator", email: "admin@novaconnect.edu", roll_number: "ADMIN001", password_hash: admin_hash, role: "Admin", department: "IT Services" }
    });
    console.log(`Admin created: admin@novaconnect.edu / admin123 (Roll: ADMIN001)`);

    // Create Faculty
    const profSmith = await prisma.user.create({
        data: { name: "Dr. Smith", email: "smith@srec.ac.in", roll_number: "FAC871", password_hash, role: "Faculty", department: "Computer Science" }
    });

    const profJones = await prisma.user.create({
        data: { name: "Prof. Jones", email: "jones@srec.ac.in", roll_number: "FAC102", password_hash, role: "Faculty", department: "Information Technology" }
    });

    // Create Students
    const student1 = await prisma.user.create({
        data: { name: "Alice Johnson", email: "alice@srec.ac.in", roll_number: "71816066", password_hash, role: "Student", department: "Computer Science" }
    });

    const student2 = await prisma.user.create({
        data: { name: "Bob Williams", email: "bob@srec.ac.in", roll_number: "71816067", password_hash, role: "Student", department: "Computer Science" }
    });

    const student3 = await prisma.user.create({
        data: { name: "Carol Davis", email: "carol@srec.ac.in", roll_number: "71816068", password_hash, role: "Student", department: "Information Technology" }
    });

    // Create Courses
    const course1 = await prisma.course.create({
        data: { course_code: "CS101", course_name: "Intro to Computer Science", faculty_id: profSmith.id, semester: 1 }
    });

    const course2 = await prisma.course.create({
        data: { course_code: "DB201", course_name: "Database Systems", faculty_id: profJones.id, semester: 3 }
    });

    const course3 = await prisma.course.create({
        data: { course_code: "AI301", course_name: "Artificial Intelligence", faculty_id: profSmith.id, semester: 5 }
    });

    // Enroll students in courses
    await prisma.enrollment.createMany({
        data: [
            { student_id: student1.id, course_id: course1.id },
            { student_id: student1.id, course_id: course2.id },
            { student_id: student2.id, course_id: course1.id },
            { student_id: student2.id, course_id: course3.id },
            { student_id: student3.id, course_id: course2.id },
            { student_id: student3.id, course_id: course3.id },
        ]
    });

    // Create Discussion Forums
    const forum1 = await prisma.forum.create({
        data: { course_id: course1.id, topic: "CS101 – General Discussion", description: "Questions and discussion about Intro to CS." }
    });

    const forum2 = await prisma.forum.create({
        data: { course_id: course2.id, topic: "DB Systems Q&A", description: "Ask your database questions here." }
    });

    // Forum Posts (with AI tag prefix format used by frontend)
    await prisma.forumPost.createMany({
        data: [
            { forum_id: forum1.id, user_id: student1.id, content: "[Exams] When is the Midterm due?" },
            { forum_id: forum1.id, user_id: student2.id, content: "[Algorithms] Can someone explain the DP algorithm from today?" },
            { forum_id: forum1.id, user_id: profSmith.id, content: "[Announcement] Midterm is scheduled for next week. Check resources tab." },
            { forum_id: forum2.id, user_id: student3.id, content: "[General] Is normalization covered in the exam?" },
        ]
    });

    // Create Assignments (due approx. 7 and 14 days from now)
    await prisma.assignment.create({
        data: {
            course_id: course1.id, created_by: profSmith.id,
            title: "Lab 1: Hello World",
            description: "Write a simple Hello World program in Python.",
            deadline: new Date(Date.now() + 7 * 86400000)
        }
    });

    await prisma.assignment.create({
        data: {
            course_id: course1.id, created_by: profSmith.id,
            title: "Midterm Essay",
            description: "Write a 500-word essay on the importance of algorithms.",
            deadline: new Date(Date.now() + 14 * 86400000)
        }
    });

    // Create Messages
    await prisma.message.create({
        data: { sender_id: profSmith.id, receiver_id: student1.id, content: "Alice, remember your Lab 1 submission is due next week!" }
    });

    await prisma.message.create({
        data: { sender_id: student1.id, receiver_id: profSmith.id, content: "Professor, can I get an extension on Lab 1?" }
    });

    // Attendance records for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.attendance.createMany({
        data: [
            { course_id: course1.id, student_id: student1.id, date: today, status: "Present" },
            { course_id: course1.id, student_id: student2.id, date: today, status: "Absent" },
        ]
    });

    console.log("\n========== SEEDING COMPLETE ==========");
    console.log("Admin:   admin@novaconnect.edu | Roll: ADMIN001 | Pass: admin123");
    console.log("Faculty: smith@srec.ac.in      | Roll: FAC871   | Pass: password123");
    console.log("Faculty: jones@srec.ac.in      | Roll: FAC102   | Pass: password123");
    console.log("Student: alice@srec.ac.in      | Roll: 71816066 | Pass: password123");
    console.log("Student: bob@srec.ac.in        | Roll: 71816067 | Pass: password123");
    console.log("Student: carol@srec.ac.in      | Roll: 71816068 | Pass: password123");
    console.log("======================================");
}

seed()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
