/**
 * Schemas JSON for Fastify route validation (server-side-pong)
 *
 * Export named schemas to be used when registering routes, e.g.:
 *  fastify.post('/rooms', { schema: createRoomSchema }, handler)
 *
 * Schemas are intentionally permissive for the game state shape (state) since
 * the in-memory state can contain varied fields.
 */

export const errorResponse = {
  type: "object",
  properties: {
    error: { type: "string" },
    message: { type: "string" },
  },
  additionalProperties: true,
};

export const paramsRoomId = {
  type: "object",
  required: ["roomId"],
  properties: {
    roomId: { type: "string", minLength: 1 },
  },
};

export const paramsId = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string", minLength: 1 },
  },
};

export const paramsPlayerId = {
  type: "object",
  required: ["playerId"],
  properties: {
    playerId: { type: "string", minLength: 1 },
  },
};

export const createRoomSchema = {
  body: {
    type: "object",
    properties: {
      public: { type: "boolean" },
      private: { type: "boolean" },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: "object",
      properties: {
        roomId: { type: "string" },
        public: { type: "boolean" },
      },
      required: ["roomId", "public"],
    },
    400: errorResponse,
    500: errorResponse,
  },
};

export const createRemoteRoomSchema = {
  body: {
    type: "object",
    properties: {
      public: { type: "boolean" },
    },
    additionalProperties: false,
  },
  response: createRoomSchema.response,
};

export const listRoomsSchema = {
  querystring: {
    type: "object",
    properties: {
      public: { type: ["boolean", "string", "number"] },
    },
    additionalProperties: true,
  },
  response: {
    200: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          players: { type: "array", items: { type: "string" } },
          public: { type: "boolean" },
          state: { type: "object", additionalProperties: true },
        },
        required: ["id", "players"],
      },
    },
    500: errorResponse,
  },
};

export const addPlayerSchema = {
  params: paramsId,
  body: {
    type: "object",
    required: ["playerId"],
    properties: {
      playerId: { type: "string", minLength: 1 },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        roomId: { type: "string" },
        players: { type: "array", items: { type: "string" } },
      },
      required: ["success", "roomId", "players"],
    },
    400: errorResponse,
    500: errorResponse,
  },
};

export const getRoomSchema = {
  params: paramsId,
  response: {
    200: {
      type: "object",
      properties: {
        id: { type: "string" },
        players: { type: "array", items: { type: "string" } },
        public: { type: "boolean" },
        state: { type: "object", additionalProperties: true },
      },
      required: ["id", "players"],
    },
    404: errorResponse,
  },
};

export const saveMatchSchema = {
  body: {
    type: "object",
    required: ["players", "score"],
    properties: {
      id: { type: "string" },
      roomId: { type: "string" },
      players: { type: "array", items: { type: "string" }, minItems: 2 },
      winner: { type: ["string", "null"] },
      score: { type: "object", additionalProperties: { type: "number" } },
      endedAt: { type: ["string", "number"] },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: "object",
      properties: {
        matchId: { type: "string" },
      },
      required: ["matchId"],
    },
    400: errorResponse,
    500: errorResponse,
  },
};

export const getMatchesByPlayerSchema = {
  params: paramsPlayerId,
  response: {
    200: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          roomId: { type: "string" },
          players: { type: "array", items: { type: "string" } },
          winner: { type: ["string", "null"] },
          score: { type: "object", additionalProperties: { type: "number" } },
          endedAt: { type: ["string", "number"] },
        },
        additionalProperties: true,
      },
    },
    400: errorResponse,
    500: errorResponse,
  },
};

/**
 * Game controller schemas
 */

export const initGameSchema = {
  params: paramsRoomId,
  response: {
    200: {
      type: "object",
      properties: {
        message: { type: "string" },
        state: { type: "object", additionalProperties: true },
      },
      required: ["message", "state"],
    },
    500: errorResponse,
  },
};

export const getStateSchema = {
  params: paramsRoomId,
  response: {
    200: {
      type: "object",
      properties: {
        paused: { type: "boolean" },
        state: { type: ["object", "null"], additionalProperties: true },
      },
      required: ["paused"],
    },
    404: errorResponse,
  },
};

export const basicRoomActionResponse = {
  200: {
    type: "object",
    properties: {
      message: { type: "string" },
    },
    required: ["message"],
  },
  400: errorResponse,
  404: errorResponse,
  500: errorResponse,
};

export const pauseSchema = {
  params: paramsRoomId,
  response: basicRoomActionResponse,
};

export const resumeSchema = {
  params: paramsRoomId,
  response: basicRoomActionResponse,
};

export const togglePauseSchema = {
  params: paramsRoomId,
  response: basicRoomActionResponse,
};

export const resetScoreSchema = {
  params: paramsRoomId,
  response: {
    200: {
      type: "object",
      properties: {
        message: { type: "string" },
        state: { type: "object", additionalProperties: true },
      },
      required: ["message", "state"],
    },
    404: errorResponse,
  },
};

export const powerupSchema = {
  params: paramsRoomId,
  querystring: {
    type: "object",
    properties: {
      enabled: { type: ["boolean", "string"] },
      random: { type: ["boolean", "string"] },
    },
    additionalProperties: true,
  },
  body: {
    type: "object",
    properties: {
      enabled: { type: "boolean" },
    },
    additionalProperties: false,
  },
  response: basicRoomActionResponse,
};

export const speedsSchema = {
  params: paramsRoomId,
  querystring: {
    type: "object",
    properties: {
      paddleSpeed: { type: ["number", "string"] },
      ballSpeedX: { type: ["number", "string"] },
      ballSpeedY: { type: ["number", "string"] },
      difficulty: { type: "string" },
      gameLength: { type: "string" },
    },
    additionalProperties: true,
  },
  body: {
    type: "object",
    properties: {
      paddleSpeed: { type: "number" },
      ballSpeedX: { type: "number" },
      ballSpeedY: { type: "number" },
      difficulty: { type: "string" },
      gameLength: { type: "string" },
    },
    additionalProperties: true,
  },
  response: {
    200: {
      type: "object",
      properties: {
        message: { type: "string" },
        state: { type: "object", additionalProperties: true },
      },
      required: ["message", "state"],
    },
    400: errorResponse,
    404: errorResponse,
    500: errorResponse,
  },
};

export const startAiSchema = {
  params: paramsRoomId,
  response: basicRoomActionResponse,
};

export const stopAiSchema = {
  params: paramsRoomId,
  response: basicRoomActionResponse,
};

export default {
  // rooms
  createRoomSchema,
  createRemoteRoomSchema,
  listRoomsSchema,
  addPlayerSchema,
  getRoomSchema,
  // matches
  saveMatchSchema,
  getMatchesByPlayerSchema,
  // game
  initGameSchema,
  getStateSchema,
  pauseSchema,
  resumeSchema,
  togglePauseSchema,
  resetScoreSchema,
  powerupSchema,
  speedsSchema,
  // ai
  startAiSchema,
  stopAiSchema,
};

export const healthSchema = {
  response: {
    200: {
      type: "object",
      properties: {
        service: { type: "string" },
        status: { type: "string" },
        uptime: { type: "number" },
        timestamp: { type: "string" },
        version: { type: "string" },
      },
      required: ["service", "status", "uptime", "timestamp"],
    },
  },
};
