import { FromSchema } from "json-schema-to-ts";

export const login42Schema = {
  description: "Redirects the user to the 42 OAuth authorization page",
  tags: ["oauth", "42"],
  response: {
    302: {
      description: "Redirect to 42 authorization URL",
      type: "null",
    },
  },
} as const;

/* export const callback42Schema = {
  description: "Handles 42 OAuth callback and redirects user after login",
  tags: ["oauth", "42"],
  querystring: {
    type: "object",
    properties: {
      code: { type: "string" },
      error: { type: "string" },
      error_description: { type: "string" },
    },
  },
  response: {
    302: {
      description: "Redirect to frontend after login or error",
      type: "null",
    },
    500: {
      description: "Internal server error during OAuth process",
      type: "object",
      properties: {
        error: { type: "string" },
      },
    },
  },
} as const; */

export const loginGoogleSchema = {
  description: "Redirects the user to Google OAuth2 login page",
  tags: ["oauth", "google"],
  response: {
    302: {
      description: "Redirect to Google OAuth2 login page",
      type: "null",
    },
  },
} as const;

export const callbackGoogleSchema = {
  description: "Google OAuth2 callback handler",
  tags: ["oauth", "google"],
  querystring: {
    type: "object",
    properties: {
      code: { type: "string" },
      error: { type: "string" },
      error_description: { type: "string" },
    },
    additionalProperties: false,
  },
  response: {
    302: {
      description: "Redirects to frontend after OAuth2 process",
      type: "null",
    },
    500: {
      description: "Internal error during Google login",
      type: "object",
      properties: {
        error: { type: "string" },
      },
      required: ["error"],
    },
  },
} as const;