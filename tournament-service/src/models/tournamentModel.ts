export interface Tournament {
    id?: number;
    name: string;
    type: "local" | "remote";
    maxPlayers: number;
    status?: "pending" | "in_progress" | "completed";
    players?: string[];
    createdAt?: string;
    updatedAt?: string;
}