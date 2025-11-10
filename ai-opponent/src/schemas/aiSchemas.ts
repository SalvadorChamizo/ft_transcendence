/**
 * JSON Schemas para los endpoints del microservicio AI (express)
 * Estos schemas están diseñados para usarse con AJV / middleware de validación.
 */

export const healthSchema = {
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string" },
      },
      required: ["status"],
      additionalProperties: true,
    },
  },
};

export const errorResponse = {
  type: "object",
  properties: {
    error: { type: "string" },
    message: { type: "string" },
  },
  additionalProperties: true,
};

export const paddleSchema = {
  type: "object",
  properties: {
    y: { type: "number" },
  },
  required: ["y"],
  additionalProperties: false,
};

export const ballSchema = {
  type: "object",
  properties: {
    x: { type: "number" },
    y: { type: "number" },
    dx: { type: "number" },
    dy: { type: "number" },
  },
  required: ["x", "y", "dx", "dy"],
  additionalProperties: false,
};

export const scoresSchema = {
  type: "object",
  properties: {
    left: { type: "number" },
    right: { type: "number" },
  },
  required: ["left", "right"],
  additionalProperties: false,
};

export const gameStateSchema = {
  type: "object",
  properties: {
    paddles: {
      type: "object",
      properties: {
        left: paddleSchema,
        right: paddleSchema,
      },
      required: ["left", "right"],
      additionalProperties: false,
    },
    ball: ballSchema,
    scores: scoresSchema,
    gameEnded: { type: "boolean" },
  },
  required: ["paddles", "ball", "scores", "gameEnded"],
  additionalProperties: false,
};

export const aiKeyEventSchema = {
  type: "object",
  properties: {
    type: { type: "string", enum: ["keydown", "keyup"] },
    key: { type: "string", enum: ["ArrowUp", "ArrowDown"] },
    atMs: { type: "integer", minimum: 0, maximum: 1000 },
  },
  required: ["type", "key", "atMs"],
  additionalProperties: false,
};

export const aiActionResponseSchema = {
  type: "object",
  properties: {
    events: {
      type: "array",
      items: aiKeyEventSchema,
    },
    debug: {
      type: "object",
      properties: {
        predictedY: { type: ["number", "null"] },
        targetY: { type: "number" },
        paddleCenterBefore: { type: "number" },
        paddleCenterAfter: { type: "number" },
        mistakeMade: { type: "boolean" },
      },
      required: ["targetY", "paddleCenterBefore", "paddleCenterAfter", "mistakeMade"],
      additionalProperties: true,
    },
  },
  required: ["events"],
  additionalProperties: true,
};

export const updateAiSchema = {
  body: {
    type: "object",
    properties: {
      state: gameStateSchema,
      side: { type: "string", enum: ["left", "right"] },
      dt: { type: "number", minimum: 0 },
    },
    required: ["state", "side"],
    additionalProperties: false,
  },
  response: {
    200: aiActionResponseSchema,
    400: errorResponse,
    500: errorResponse,
  },
};
