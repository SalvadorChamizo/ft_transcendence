import { FromSchema } from "json-schema-to-ts"

export const playerSchema = {
  type: "object",
  properties: {
    id: { type: "number" },
    username: { type: "string" },
    user_id: { type: ["number", "null"] },
    tournament_id: { type: "number" },
    seed: { type: "number" },
    score: { type: "number" },
    eliminated: { type: "boolean" },
    is_ai: { type: "boolean" },
  },
  required: ["id", "username", "tournament_id", "score", "eliminated", "is_ai"],
} as const;

// Match schema
export const matchSchema = {
  type: "object",
  properties: {
    id: { type: "number" },
    tournament_id: { type: "number" },
    round: { type: "number" },
    player1_id: { type: ["number", "null"] },
    player2_id: { type: ["number", "null"] },
    winner_id: { type: ["number", "null"] },
    score_player1: { type: ["number", "null"] },
    score_player2: { type: ["number", "null"] },
    roomId: { type: "string" },
    status: { type: "string" },
    created_at: { type: "string" },
    updated_at: { type: ["string", "null"] },
  },
  required: ["id", "tournament_id", "status", "roomId", "created_at"],
} as const;

// Tournament schema
export const tournamentSchema = {
  type: "object",
  properties: {
    id: { type: "number" },
    name: { type: "string" },
    maxPlayers: { type: "number" },
    currentPlayers: { type: "number" },
    status: { type: "string" },
    created_at: { type: "string" },
    updated_at: { type: ["string", "null"] },
    players: { type: "array", items: playerSchema },
    matches: { type: "array", items: matchSchema },
  },
  required: ["id", "name", "maxPlayers", "currentPlayers", "status", "created_at", "players", "matches"],
} as const;

// TypeScript types
export type Tournament = FromSchema<typeof tournamentSchema>;
export type Player = FromSchema<typeof playerSchema>;
export type Match = FromSchema<typeof matchSchema>;

export const getTournamentsSchema = {
  description: "Get all remote tournaments",
  tags: ["Tournaments"],
  response: {
    200: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "number" },
          name: { type: "string" },
          mode: { type: "string", enum: ["local", "remote"] },
          creator_id: { type: ["number", "null"] },
          status: { type: "string" },
          winner_id: { type: ["number", "null"] },
          max_players: { type: ["number", "null"] },
          current_players: { type: "number" },
          current_round: { type: "number" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: ["string", "null"], format: "date-time" },
        },
        required: [
          "id",
          "name",
          "mode",
          "creator_id",
          "status",
          "winner_id",
          "max_players",
          "current_players",
          "current_round",
          "created_at",
          "updated_at",
        ],
      },
    },
    500: {
      type: "object",
      properties: {
        error: { type: "string" },
      },
    },
  },
} as const;

export const getTournamentByIdSchema = {
  description: "Get a single tournament by its ID",
  tags: ["Tournaments"],
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        id: { type: "number" },
        name: { type: "string" },
        mode: { type: "string", enum: ["local", "remote"] },
        creator_id: { type: "number" },
        status: { type: "string" },
        winner_id: { type: ["number", "null"] },
        max_players: { type: "number" },
        current_players: { type: "number" },
        current_round: { type: "number" },
        created_at: { type: "string" },
        updated_at: { type: ["string", "null"] },
      },
      required: [
        "id",
        "name",
        "mode",
        "creator_id",
        "status",
        "winner_id",
        "max_players",
        "current_players",
        "current_round",
        "created_at",
        "updated_at",
      ],
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string" },
      },
    },
  },
} as const;

export const createLocalTournamentSchema = {
  description: "Create a new local tournament with up to 4 players",
  tags: ["Tournaments"],
  body: {
    type: "object",
    required: ["tournamentName", "tournamentPlayers", "playerOne"],
    properties: {
      tournamentName: { type: "string", minLength: 1, maxLength: 30 },
      tournamentPlayers: { type: "number", minimum: 2, maximum: 4 },
      playerOne: { type: "string", minLength: 1, maxLength: 10 },
      playerTwo: { type: "string", minLength: 1, maxLength: 10 },
      playerThree: { type: "string", minLength: 1, maxLength: 10 },
      playerFour: { type: "string", minLength: 1, maxLength: 10 },
    },
  },
  response: {
    201: {
      type: "object",
      properties: {
        tournament: {
          type: "object",
          properties: {
            id: { type: "number" },
            name: { type: "string" },
            mode: { type: "string" },
            creator_id: { type: ["number", "null"] },
            max_players: { type: "number" },
            players: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  username: { type: "string" },
                  user_id: { type: ["number", "null"] },
                  tournament_id: { type: "number" },
                  seed: { type: "number" },
                  score: { type: "number" },
                  eliminated: { type: "boolean" },
                  is_ai: { type: "boolean" },
                },
                required: ["id", "username", "user_id", "tournament_id", "seed", "score", "eliminated", "is_ai"],
              },
            },
          },
          required: ["id", "name", "mode", "creator_id", "max_players", "players"],
        },
        shuffledPlayers: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["tournament", "shuffledPlayers"],
    },
    400: {
      type: "object",
      properties: { error: { type: "string" } },
      required: ["error"],
    },
    500: {
      type: "object",
      properties: { error: { type: "string" } },
      required: ["error"],
    },
  },
} as const;

export const startTournamentSchema = {
  description: "Start a tournament by its ID",
  tags: ["Tournaments"],
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" }, // route param
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        tournament: {
          type: "object",
          properties: {
            id: { type: "number" },
            name: { type: "string" },
            max_players: { type: "number" },
            status: { type: "string" },
            current_round: { type: "number" },
          },
          required: ["id", "name", "max_players", "status", "current_round"],
        },
        players: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "number" },
              username: { type: "string" },
            },
            required: ["id", "username"],
          },
        },
        matches: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "number" },
              player1_id: { type: "number" },
              player2_id: { type: "number" },
              round: { type: "number" },
              status: { type: "string" },
            },
            required: ["id", "player1_id", "player2_id", "round", "status"],
          },
        },
      },
      required: ["tournament", "players", "matches"],
    },
    400: {
      type: "object",
      properties: { error: { type: "string" } },
      required: ["error"],
    },
    404: {
      type: "object",
      properties: { error: { type: "string" } },
      required: ["error"],
    },
    500: {
      type: "object",
      properties: { error: { type: "string" } },
      required: ["error"],
    },
  },
} as const;

export const startRemoteTournamentSchema = {
  description: "Start a remote tournament by its ID",
  tags: ["Tournaments"],
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", description: "Tournament ID" },
    },
  },
  response: {
    200: {
      type: "object",
      description: "Successfully started remote tournament",
      properties: {
        tournament: {
          type: "object",
          properties: {
            id: { type: "number" },
            name: { type: "string" },
            max_players: { type: "number" },
            status: { type: "string" },
            current_round: { type: "number" },
          },
          required: ["id", "name", "max_players", "status", "current_round"],
        },
        players: {
          type: "array",
          description: "List of tournament players",
          items: {
            type: "object",
            properties: {
              id: { type: "number" },
              username: { type: "string" },
            },
            required: ["id", "username"],
          },
        },
        matches: {
          type: "array",
          description: "List of first-round matches created when starting the remote tournament",
          items: {
            type: "object",
            properties: {
              id: { type: "number" },
              player1_id: { type: ["number", "null"] },
              player2_id: { type: ["number", "null"] },
              round: { type: "number" },
              status: { type: "string" },
            },
            required: ["id", "round", "status"],
          },
        },
      },
      required: ["tournament", "players", "matches"],
    },
    400: {
      type: "object",
      description: "Invalid request or tournament cannot be started",
      properties: {
        error: { type: "string" },
      },
      required: ["error"],
    },
    404: {
      type: "object",
      description: "Tournament not found",
      properties: {
        error: { type: "string" },
      },
      required: ["error"],
    },
    500: {
      type: "object",
      description: "Server error while starting remote tournament",
      properties: {
        error: { type: "string" },
      },
      required: ["error"],
    },
  },
} as const;

export const advanceTournamentSchema = {
  description: "Advance a tournament to the next round with the provided winners",
  tags: ["Tournaments"],
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
  body: {
    type: "object",
    required: ["winners"],
    properties: {
      winners: {
        type: "array",
        items: {
          type: "object",
          required: ["id", "username"],
          properties: {
            id: { type: "number" },
            username: { type: "string" },
          },
        },
      },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        tournament: {
          type: "object",
          properties: {
            id: { type: "number" },
            name: { type: "string" },
            mode: { type: "string" },
            creator_id: { type: ["number", "null"] },
            max_players: { type: "number" },
            current_round: { type: "number" },
            status: { type: "string" },
            winner_id: { type: ["number", "null"] },
          },
          required: ["id", "name", "mode", "creator_id", "max_players", "current_round", "status"],
        },
        matches: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "number" },
              player1_id: { type: "number" },
              player2_id: { type: "number" },
              round: { type: "number" },
              status: { type: "string" },
            },
            required: ["id", "player1_id", "player2_id", "round", "status"],
          },
        },
      },
      required: ["tournament", "matches"],
    },
    400: {
      type: "object",
      properties: { error: { type: "string" } },
      required: ["error"],
    },
    404: {
      type: "object",
      properties: { error: { type: "string" } },
      required: ["error"],
    },
    500: {
      type: "object",
      properties: { error: { type: "string" } },
      required: ["error"],
    },
  },
} as const;

export const createRemoteTournamentSchema = {
  description: "Create a new remote tournament (requires authentication via x-user-id and x-username headers)",
  tags: ["Tournaments"],
  headers: {
    type: "object",
    properties: {
      "x-user-id": { type: "string" },
      "x-username": { type: "string" },
    },
    required: ["x-user-id", "x-username"],
  },
  body: {
    type: "object",
    required: ["tournamentName", "tournamentPlayers"],
    properties: {
      tournamentName: { type: "string", maxLength: 30 },
      tournamentPlayers: { type: "number", minimum: 2 },
    },
  },
  response: {
    201: {
      type: "object",
      properties: {
        tournament: {
          type: "object",
          properties: {
            id: { type: "number" },
            name: { type: "string" },
            mode: { type: "string" },
            creator_id: { type: ["number", "null"] },
            max_players: { type: "number" },
            current_players: { type: "number" },
            current_round: { type: "number" },
            status: { type: "string" },
            players: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  username: { type: "string" },
                  user_id: { type: ["number", "null"] },
                  tournament_id: { type: "number" },
                  seed: { type: "number" },
                  score: { type: "number" },
                  eliminated: { type: "boolean" },
                  is_ai: { type: "boolean" },
                },
                required: ["id", "username", "user_id", "tournament_id", "seed", "score", "eliminated", "is_ai"],
              },
            },
            matches: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  player1_id: { type: "number" },
                  player2_id: { type: "number" },
                  winner_id: { type: ["number", "null"] },
                  score_player1: { type: "number" },
                  score_player2: { type: "number" },
                  roomId: { type: "string" },
                  status: { type: "string" },
                  round: { type: "number" },
                },
                required: ["id", "player1_id", "player2_id", "winner_id", "score_player1", "score_player2", "roomId", "status", "round"],
              },
            },
          },
          required: ["id", "name", "mode", "creator_id", "max_players", "players", "matches"],
        },
      },
      required: ["tournament"],
    },
    400: {
      type: "object",
      properties: { error: { type: "string" } },
      required: ["error"],
    },
    401: {
      type: "object",
      properties: { error: { type: "string" } },
      required: ["error"],
    },
    500: {
      type: "object",
      properties: { error: { type: "string" } },
      required: ["error"],
    },
  },
} as const;

export const joinTournamentSchema = {
  description: "Join an existing remote tournament (requires authentication via x-user-id and x-username headers)",
  tags: ["Tournaments"],
  headers: {
    type: "object",
    properties: {
      "x-user-id": { type: "string" },
      "x-username": { type: "string" },
    },
    required: ["x-user-id", "x-username"],
  },
  params: {
    type: "object",
    properties: {
      id: { type: "string" },
    },
    required: ["id"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        message: { type: "string" },
      },
      required: ["message"],
    },
    400: {
      type: "object",
      properties: {
        error: { type: "string" },
      },
      required: ["error"],
    },
    401: {
      type: "object",
      properties: {
        error: { type: "string" },
      },
      required: ["error"],
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string" },
      },
      required: ["error"],
    },
    500: {
      type: "object",
      properties: {
        error: { type: "string" },
      },
      required: ["error"],
    },
  },
} as const;

export const leaveTournamentSchema = {
  description: "Leave a remote tournament (requires authentication via x-user-id and x-username headers)",
  tags: ["Tournaments"],
  headers: {
    type: "object",
    properties: {
      "x-user-id": { type: "string" },
      "x-username": { type: "string" },
    },
    required: ["x-user-id", "x-username"],
  },
  params: {
    type: "object",
    properties: {
      id: { type: "string" },
    },
    required: ["id"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        message: { type: "string" },
      },
      required: ["message"],
    },
    400: {
      type: "object",
      properties: {
        error: { type: "string" },
      },
      required: ["error"],
    },
    401: {
      type: "object",
      properties: {
        error: { type: "string" },
      },
      required: ["error"],
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string" },
      },
      required: ["error"],
    },
    500: {
      type: "object",
      properties: {
        error: { type: "string" },
      },
      required: ["error"],
    },
  },
} as const;

export const updateMatchResultSchema = {
  description:
    "Update a match result for a local or remote tournament. Automatically advances the tournament round if all matches in the round are completed.",
  tags: ["Tournaments"],
  params: {
    type: "object",
    properties: {
      matchId: { type: "string", description: "Unique ID of the match to update." },
    },
    required: ["matchId"],
  },
  body: {
    type: "object",
    properties: {
      winnerId: { type: "number", description: "ID of the player who won the match." },
    },
    required: ["winnerId"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        message: { type: "string", example: "Match result updated successfully" },
      },
      required: ["message"],
    },
    400: {
      type: "object",
      properties: {
        error: { type: "string", example: "winnerId is required or Failed to update match result" },
      },
      required: ["error"],
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string", example: "Match or Tournament not found" },
      },
      required: ["error"],
    },
    500: {
      type: "object",
      properties: {
        error: { type: "string", example: "Failed to update match result" },
      },
      required: ["error"],
    },
  },
} as const;

export const getTournamentPlayersSchema = {
  description: "Retrieve all players registered in a specific tournament by tournament ID.",
  tags: ["Tournaments"],
  params: {
    type: "object",
    properties: {
      id: { type: "string", description: "Tournament ID" },
    },
    required: ["id"],
  },
  response: {
    200: {
      type: "array",
      description: "List of players in the specified tournament.",
      items: {
        type: "object",
        properties: {
          id: { type: "number" },
          username: { type: "string" },
          user_id: { type: ["number", "null"], description: "Linked user account ID, if applicable." },
          tournament_id: { type: "number" },
          seed: { type: ["number", "null"], description: "Seeding number of the player (if applicable)." },
          score: { type: "number" },
          eliminated: { type: "boolean" },
          is_ai: { type: "boolean", description: "Indicates if the player is an AI-controlled participant." },
        },
        required: ["id", "username", "tournament_id", "score", "eliminated", "is_ai"],
      },
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string", example: "Tournament not found or has no players" },
      },
      required: ["error"],
    },
    500: {
      type: "object",
      properties: {
        error: { type: "string", example: "Internal server error" },
      },
      required: ["error"],
    },
  },
} as const;

export const getTournamentMatchesWithRoomsSchema = {
  description: "Fetch all matches (including room information and player data) for a given tournament ID.",
  tags: ["Tournaments"],
  params: {
    type: "object",
    properties: {
      id: { type: "string", description: "Tournament ID" },
    },
    required: ["id"],
  },
  response: {
    200: {
      type: "array",
      description: "List of matches with player and room info for the specified tournament.",
      items: {
        type: "object",
        properties: {
          id: { type: "number" },
          round: { type: ["number", "null"] },
          status: { type: "string", enum: ["pending", "in_progress", "completed"] },
          roomId: { type: ["string", "null"] },
          player1: {
            type: ["object", "null"],
            properties: {
              id: { type: ["number", "null"] },
              username: { type: ["string", "null"] },
            },
            required: ["id", "username"],
          },
          player2: {
            type: ["object", "null"],
            properties: {
              id: { type: ["number", "null"] },
              username: { type: ["string", "null"] },
            },
            required: ["id", "username"],
          },
        },
        required: ["id", "status", "roomId"],
      },
    },
    404: {
      type: "object",
      properties: {
        message: { type: "string" },
      },
      required: ["message"],
    },
    500: {
      type: "object",
      properties: {
        error: { type: "string" },
      },
      required: ["error"],
    },
  },
} as const;

export const getMatchByIdSchema = {
  description: "Retrieve detailed information about a specific match by its ID.",
  tags: ["Tournaments"],
  params: {
    type: "object",
    properties: {
      matchId: { type: "string", description: "Match ID" },
    },
    required: ["matchId"],
  },
  response: {
    200: {
      type: "object",
      description: "Match details retrieved successfully.",
      properties: {
        id: { type: "number" },
        tournament_id: { type: "number" },
        round: { type: ["number", "null"] },
        player1_id: { type: ["number", "null"] },
        player2_id: { type: ["number", "null"] },
        winner_id: { type: ["number", "null"] },
        score_player1: { type: ["number", "null"] },
        score_player2: { type: ["number", "null"] },
        roomId: { type: "string" },
        status: { type: "string", enum: ["pending", "in_progress", "completed"] },
        created_at: { type: "string", format: "date-time" },
        updated_at: { type: ["string", "null"], format: "date-time" },
      },
      required: [
        "id",
        "tournament_id",
        "roomId",
        "status",
        "created_at",
      ],
    },
    404: {
      type: "object",
      properties: {
        message: { type: "string" },
      },
      required: ["message"],
    },
    500: {
      type: "object",
      properties: {
        error: { type: "string" },
      },
      required: ["error"],
    },
  },
} as const;

export const updateMatchRoomSchema = {
  description: "Update the room ID associated with a specific match.",
  tags: ["Tournaments"],
  params: {
    type: "object",
    properties: {
      matchId: { type: "string", description: "ID of the match to update" },
    },
    required: ["matchId"],
  },
  body: {
    type: "object",
    properties: {
      roomId: { type: "string", description: "New room ID to associate with the match" },
    },
    required: ["roomId"],
  },
  response: {
    200: {
      type: "object",
      description: "Match room successfully updated.",
      properties: {
        message: { type: "string" },
      },
      required: ["message"],
    },
    400: {
      type: "object",
      properties: {
        error: { type: "string" },
      },
      required: ["error"],
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string" },
      },
      required: ["error"],
    },
    500: {
      type: "object",
      properties: {
        error: { type: "string" },
      },
      required: ["error"],
    },
  },
} as const;

export type GetTournamentByIdParams = FromSchema<typeof getTournamentByIdSchema.params>;
export type CreateLocalTournamentBody = FromSchema<typeof createLocalTournamentSchema.body>;
export type StartTournamentParams = FromSchema<typeof startTournamentSchema.params>;
export type StartRemoteTournamentParams = FromSchema<typeof startTournamentSchema.params>;
export type AdvanceTournamentParams = FromSchema<typeof advanceTournamentSchema.params>;
export type AdvanceTournamentBody = FromSchema<typeof advanceTournamentSchema.body>;
export type CreateRemoteTournamentHeaders = FromSchema<typeof createRemoteTournamentSchema.headers>;
export type CreateRemoteTournamentBody = FromSchema<typeof createRemoteTournamentSchema.body>;
export type JoinTournamentHeaders = FromSchema<typeof joinTournamentSchema.headers>;
export type JoinTournamentParams = FromSchema<typeof joinTournamentSchema.params>;
export type LeaveTournamentHeaders = FromSchema<typeof leaveTournamentSchema.headers>;
export type LeaveTournamentParams = FromSchema<typeof leaveTournamentSchema.params>;
export type UpdateMatchResultParams = FromSchema<typeof updateMatchResultSchema.params>;
export type UpdateMatchResultBody = FromSchema<typeof updateMatchResultSchema.body>;
export type GetTournamentPlayersParams = FromSchema<typeof getTournamentPlayersSchema.params>;
export type GetTournamentPlayersResponse = FromSchema<typeof getTournamentPlayersSchema.response["200"]>;
export type GetTournamentMatchesWithRoomsParams = FromSchema<typeof getTournamentMatchesWithRoomsSchema.params>;
export type GetTournamentMatchesWithRoomsResponse = FromSchema<typeof getTournamentMatchesWithRoomsSchema.response["200"]>;
export type GetMatchByIdParams = FromSchema<typeof getMatchByIdSchema.params>;
export type GetMatchByIdResponse = FromSchema<typeof getMatchByIdSchema.response["200"]>;
export type UpdateMatchRoomParams = FromSchema<typeof updateMatchRoomSchema.params>;
export type UpdateMatchRoomBody = FromSchema<typeof updateMatchRoomSchema.body>;
export type UpdateMatchRoomResponse = FromSchema<typeof updateMatchRoomSchema.response["200"]>;