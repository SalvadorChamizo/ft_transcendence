import Database from "better-sqlite3"

const db: any = new Database("chat.db");

// Table for conversations between users
db.prepare(`
    CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        participant1_id INTEGER NOT NULL,
        participant2_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(participant1_id, participant2_id)
    )
`).run();

// Message board
db.prepare(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        message_type TEXT DEFAULT 'text',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        delivered_at DATETIME DEFAULT NULL,
        read_at DATETIME DEFAULT NULL,
        FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    )
`).run();

// Table for blocked users
db.prepare(`
    CREATE TABLE IF NOT EXISTS blocked_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        blocker_id INTEGER NOT NULL,
        blocked_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(blocker_id, blocked_id)
    )
`).run();

// Table for game invitations
db.prepare(`
    CREATE TABLE IF NOT EXISTS game_invitations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_user_id INTEGER NOT NULL,
        to_user_id INTEGER NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected', 'expired')),
        game_type TEXT DEFAULT 'pong',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL
    )
`).run();

// Migration: Add delivered_at and read_at columns if they don't exist
try {
    db.prepare(`ALTER TABLE messages ADD COLUMN delivered_at DATETIME DEFAULT NULL`).run();
    console.log('✅ Added delivered_at column to messages table');
} catch (error: any) {
    if (!error.message.includes('duplicate column name')) {
        console.error('Error adding delivered_at column:', error);
    }
}

try {
    db.prepare(`ALTER TABLE messages ADD COLUMN read_at DATETIME DEFAULT NULL`).run();
    console.log('✅ Added read_at column to messages table');
} catch (error: any) {
    if (!error.message.includes('duplicate column name')) {
        console.error('Error adding read_at column:', error);
    }
}

export default db;
