-- CreateTable
CREATE TABLE "ForumMessage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "forum_id" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "message_text" TEXT NOT NULL,
    "ai_category" TEXT DEFAULT 'General',
    "attachment_url" TEXT,
    "attachment_name" TEXT,
    "reply_to_id" INTEGER,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ForumMessage_forum_id_fkey" FOREIGN KEY ("forum_id") REFERENCES "Forum" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ForumMessage_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ForumMessage_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ForumMessage_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "ForumMessage" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
