import db from "../db/sqlite"

export interface RefreshToken {
    id: number;
    user_id: number;
    token: string;
    created_at: string;
}

export class RefreshTokenRepository {
    add(userId: number, token: string): void {
        db.prepare("INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)").run(userId, token);
    }

    findByToken(token: string): RefreshToken | undefined {
        return db.prepare("SELECT * FROM refresh_tokens WHERE token = ?").get(token);
    }

    delete(token: string): void {
        db.prepare("DELETE FROM refresh_tokens WHERE token = ?").run(token);
    }

    deleteAllForUser(userId: number): void {
        db.prepare("DELETE FROM refresh_tokens WHERE user_id = ?").run(userId);
    }
}