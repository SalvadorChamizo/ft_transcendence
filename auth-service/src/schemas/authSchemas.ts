import { FromSchema } from "json-schema-to-ts";

export const registerSchema = {
    description: "Registers a new user with username, password, and email",
    tags: ["auth", "registration"],
    body: {
        type: "object",
        required: ["username", "password", "email"],
        properties: {
            username: { type: "string", minLength: 3, maxLength: 12 },
            password: { type: "string", minLength: 6, maxLength: 12, pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[-!@#$%^&*(),.?":{}|<>]).+$' },
            email: { type: "string", format: "email" },
        },
    },
    response: {
        200: {
            type: "object",
            properties: {
                message: { type: "string" },
            },
        },
    },
} as const;

export const loginSchema = {
    description: "Authenticates a user and returns an access token. May require 2FA verification if enabled.",
    tags: ["auth", "login"],
    body: {
        type: "object",
        required: ["username", "password"],
        properties: {
            username: { type: "string", minLength: 3 },
            password: { type: "string", minLength: 6 },
        },
    },
    response: {
        200: {
            type: "object",
            properties: {
                accessToken: { type: "string" },
                requires2FA: { type: "boolean" },
                userId: { type: "number" },
                username: { type: "string" },
                user: {
                    type: "object",
                    properties: {
                        id: { type: "number" },
                        username: { type: "string" },
                        email: { type: "string" },
                        twofa: { type: "boolean" },
                    },
                    required: ["id", "username", "email", "twofa"],
                },
                success: { type: "boolean" },
                error: { type: "string" },
            },
        },
    },
};

export const refreshSchema = {
    description: "Rotate access and refresh tokens using the refresh token cookie",
    tags: ["auth"],
    response: {
        200: {
            type: "object",
            properties: {
                accessToken: { type: "string" },
                success: { type: "boolean" },
                error: { type: "string" },
            },
            additionalProperties: false,
        },
    },
} as const;

export const logoutSchema = {
    description: "Logs out a user by crearing their refresh token cookie",
    tags: ["auth"],
    response: {
        200: {
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
            },
            required: ["success", "message"],
            additionalProperties: false,
        },
        400: {
            type: "object",
            properties: {
                error: { type: "string" },
            },
            required: ["error"],
            additionalProperties: false,
        },
        500: {
            type: "object",
            properties: {
                error: { type: "string" },
            },
            required: ["error"],
            additionalProperties: false,
        },
    },
} as const;

export const verify2FASchema = {
  description: "Verifies a 2FA code and either enables 2FA or returns access tokens.",
  tags: ["auth", "2fa"],
  body: {
    type: "object",
    required: ["userId", "code"],
    properties: {
      userId: { type: "number" },
      code: { type: "string", minLength: 6, maxLength: 6 },
    },
  },
  response: {
    200: {
      oneOf: [
        {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
          },
          required: ["success", "message"],
          additionalProperties: false,
        },
        {
          type: "object",
          properties: {
            accessToken: { type: "string" },
            user: {
              type: "object",
              properties: {
                id: { type: "number" },
                username: { type: "string" },
                email: { type: "string" },
                twofa: { type: "boolean" },
              },
              required: ["id", "username", "email", "twofa"],
              additionalProperties: false,
            },
          },
          required: ["accessToken", "user"],
          additionalProperties: false,
        },
      ],
    },
  },
} as const;

export const enable2FASchema = {
    description: "Enable 2FA for a user (starts 2FA setup)",
    tags: ["auth"],
    body: {
        type: "object",
        required: ["username", "userId"],
        properties: {
            username: { type: "string", minLength: 3},
            userId: { type: "number" },
        },
    },
    response: {
        200: {
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

export const generateQRSchema = {
    description: "Generate 2FA QR code foa a user",
    tags: ["auth"],
    body: {
        type: "object",
        required: ["username", "userId"],
        properties: {
            username: { type: "string", minLength: 3 },
            userId: { type: "number" },
        },
    },
    response: {
        200: {
            type: "object",
            properties: {
                qr: { type: "string" },
            },
            required: ["qr"],
        },
        400: {
            type: "object",
            properties: {
                error: { type: "string" },
            },
            required: ["error"],
        },
    },
} as const;

export const forgotPasswordSchema = {
    description: "Request a password reset, sends a new password via email",
    tags: ["auth"],
    body: {
        type: "object",
        required: ["email"],
        properties: {
            email: {
                type: "string",
                format: "email"
            },
        },
    },
    response: {
        200: {
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
            },
            required: ["success", "message"],
        },
        400: {
            type: "object",
            properties: {
                success: { type: "boolean" },
                error: { type: "string" },
            },
            required: ["success", "error"],
        },
        500: {
            type: "object",
            properties: {
                success: { type: "boolean" },
                error: { type: "string" },
            },
            required: ["success", "error"],
        },
    },
} as const;

export const restoreUserSchema = {
  description: "Restore an authenticated user's session using x-user-id header",
  tags: ["auth"],
  headers: {
    type: "object",
    properties: {
      "x-user-id": { type: "string" },
    },
    required: ["x-user-id"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            id: { type: "number" },
            username: { type: "string" },
            email: { type: "string" },
            twofa: { type: "boolean" },
          },
          required: ["id", "username", "email", "twofa"],
        },
      },
      required: ["user"],
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

export const deleteUserSchema = {
  description: "Delete a user and all related data",
  tags: ["auth"],
  body: {
    type: "object",
    properties: {
      userId: { type: "number" },
    },
    required: ["userId"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
      },
      required: ["success", "message"],
    },
    400: {
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

export type RegisterBody = FromSchema<typeof registerSchema.body>;
export type LoginBody = FromSchema<typeof loginSchema.body>;
export type Verify2FABody = FromSchema<typeof verify2FASchema.body>;
export type Enable2FABody = FromSchema<typeof enable2FASchema.body>;
export type GenerateQRBody = FromSchema<typeof generateQRSchema.body>;
export type ForgotPasswordBody = FromSchema<typeof forgotPasswordSchema.body>;
export type DeleteUserBody = FromSchema<typeof deleteUserSchema.body>;

export type RestoreUserHeaders = FromSchema<typeof restoreUserSchema.headers>;