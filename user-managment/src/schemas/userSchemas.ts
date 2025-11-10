export const registerSchema = {
  body: {
    type: 'object',
    required: ['email', 'username', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      username: { type: 'string', minLength: 3, maxLength: 10 },
      password: { type: 'string', minLength: 6, maxLength: 12, pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$' }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        result: { type: 'string' }
      }
    },
    400: {
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
};