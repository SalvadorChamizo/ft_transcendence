export const registerSchema = {
  body: {
    type: 'object',
    required: ['email', 'username', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      username: { type: 'string', minLength: 3, maxLength: 12 },
      password: { type: 'string', minLength: 6, maxLength: 12, pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[-!@#$%^&*(),.?":{}|<>]).+$' }
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

export const usernameChangerSchema = {
  headers: {
    type: 'object',
    required: ['x-user-id'],
    properties: { 'x-user-id': { type: 'string' } }
  },
  body: {
    type: "object",
    required: ["newUsername"],
    properties: {
      newUsername: { type: "string", minLength: 3, maxLength: 10 }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: { result: { type: 'string' } },
      required: ["result"]
    },
    400: {
      type: 'object',
      properties: { error: { type: 'string' } },
      required: ["error"]
    },
    401: {
      type: 'object',
      properties: { error: { type: 'string' } },
      required: ["error"]
    }
  }
};

export const addVictorySchema = {
  headers: {
    type: 'object',
    required: ['x-user-id'],
    properties: { 'x-user-id': { type: 'string' } }
  },
  body: {
    type: "object",
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      },
      required: ["message"]
    },
    401: {
      type: 'object',
      properties: { error: { type: 'string' } },
      required: ["error"]
    }
  }
};

export const passwordChangerSchema = {
  headers: {
    type: 'object',
    required: ['x-user-id'],
    properties: { 'x-user-id': { type: 'string' } }
  },
  body: {
    type: "object",
    required: ["newPassword"],
    properties: {
      newPassword: {
        type: "string",
        minLength: 8,
        maxLength: 20,
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[-!@#$%^&*(),.?":{}|<>]).+$'
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: { message: { type: 'string' } },
      required: ["message"]
    },
    400: {
      type: 'object',
      properties: { error: { type: 'string' } },
      required: ["error"]
    },
    401: {
      type: 'object',
      properties: { error: { type: 'string' } },
      required: ["error"]
    }
  }
};

export const userDetailsSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        username: { type: 'string' },
        email: { type: 'string', format: 'email' },
        victories: { type: 'integer' }
      },
      required: ['id', 'username', 'email', 'victories']
    },
    401: {
      type: 'object',
      properties: { error: { type: 'string' } },
      required: ["error"]
    }
  }
};

export const getResultsSchema = {
  headers: {
    type: 'object',
    required: ['x-user-id'],
    properties: {
      'x-user-id': { type: 'string' }
    }
  },
  response: {
    200: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          matchId: { anyOf: [{ type: 'string' }, { type: 'number' }] },
          result: { type: 'string' },
          date: { type: 'string' }
        },
        required: ['matchId', 'result', 'date']
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

export const addDefeatSchema = {
  body: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'number' }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' }
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

export const getAllUsersSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        users: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              username: { type: 'string' }
            },
            required: ['id', 'username']
          }
        }
      }
    },
    500: {
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
};

export const getFriendSchema = {
  headers: {
    type: 'object',
    required: ['x-user-id'],
    properties: {
      'x-user-id': { type: 'string' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        friends: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              username: { type: 'string' }
            },
            required: ['id', 'username']
          }
        },
        count: { type: 'integer' }
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

export const addFriendSchema = {
  headers: {
    type: 'object',
    required: ['x-user-id'],
    properties: { 'x-user-id': { type: 'string' } }
  },
  body: {
    type: 'object',
    required: ['friendId'],
    properties: {
      friendId: { type: 'string' }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        friendId: { type: 'string' }
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

export const removeFriendSchema = {
  headers: {
    type: 'object',
    required: ['x-user-id'],
    properties: { 'x-user-id': { type: 'string' } }
  },
  body: {
    type: 'object',
    required: ['friendId'],
    properties: {
      friendId: { type: 'string' }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        friendId: { type: 'string' }
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

export const checkFriendSchema = {
  headers: {
    type: 'object',
    required: ['x-user-id'],
    properties: { 'x-user-id': { type: 'string' } }
  },
  body: {
    type: 'object',
    required: ['friendId'],
    properties: {
      friendId: { type: 'string' }
    },
    additionalProperties: false
  },
  response: {
    200: {
      oneOf: [
        {
          type: 'object',
          properties: { isFriend: { type: 'boolean' } },
          required: ['isFriend']
        },
        { type: 'boolean' }
      ]
    },
    400: {
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
};

/* export const register42Schema = {
  body: {
    type: 'object',
    required: ['email', 'username'],
    properties: {
      email: { type: 'string', format: 'email' },
      username: { type: 'string', minLength: 3, maxLength: 10 }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        result: { type: 'object' },       // <-- must be object
        user: {                           // <-- define user properties
          type: 'object',
          required: ['id', 'username', 'email'],
          properties: {
            id: { type: 'integer' },
            username: { type: 'string' },
            email: { type: 'string' }
          }
        }
      }
    },
    400: {
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
}; */

export const loginTimeRegisterSchema = {
  body: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'number' }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' }
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

export const emailChangerSchema = {
  body: {
    type: 'object',
    required: ['newEmail'],
    properties: {
      newEmail: { type: 'string', format: 'email' }
    },
    additionalProperties: false
  },
  headers: {
    type: 'object',
    required: ['x-user-id'],
    properties: {
      'x-user-id': { type: 'string' }
    }
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
    },
    401: {
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
};

export const userGetterByUsernameSchema = {
  body: {
    type: 'object',
    required: ['username'],
    properties: {
      username: { type: 'string' }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        username: { type: 'string' },
        email: { type: 'string', format: 'email' },
        victories: { type: 'integer' },
        defeats: { type: 'integer' }
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

export const userGetterByEmailSchema = {
  body: {
    type: 'object',
    required: ['email'],
    properties: {
      email: { type: 'string', format: 'email' }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        username: { type: 'string' },
        email: { type: 'string', format: 'email' },
        victories: { type: 'integer' },
        defeats: { type: 'integer' }
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

export const userGetterByIdSchema = {
  body: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'number' }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        username: { type: 'string' },
        email: { type: 'string', format: 'email' },
        victories: { type: 'integer' },
        defeats: { type: 'integer' }
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

export const avatarGetterSchema = {
  headers: {
    type: 'object',
    required: ['x-user-id'],
    properties: {
      'x-user-id': { type: 'string' }
    }
  },
  response: {
    200: {
      type: 'string',
      format: 'binary'
    },
    400: {
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    },
    401: {
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
};

export const avatarChangerSchema = {
  headers: {
    type: 'object',
    required: ['x-user-id'],
    properties: {
      'x-user-id': { type: 'string' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' }
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

export const passwordControlSchema = {
  body: {
    type: 'object',
    required: ['username', 'password'],
    properties: {
      username: { type: 'string' },
      password: { type: 'string' }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' }
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

export const passwordChangerControllerSchema = {
  body: {
    type: 'object',
    required: ['newPassword', 'userId'],
    properties: {
      newPassword: { type: 'string', minLength: 8, maxLength: 20, pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[-!@#$%^&*(),.?":{}|<>]).+$' },
      userId: { type: 'number' }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' }
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

export const getCurrentUserSchema = {
  headers: {
    type: 'object',
    required: ['x-user-id'],
    properties: {
      'x-user-id': { type: 'string' },
      'x-username': { type: 'string' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            victories: { type: 'integer' },
            defeats: { type: 'integer' },
            matchHistory: { type: 'array', items: { type: 'object' } }
          },
          required: ['id', 'username', 'email']
        }
      },
      required: ['user']
    },
    401: {
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
};

export const removeUserSchema = {
  headers: {
    type: 'object',
    required: ['x-user-id'],
    properties: {
      'x-user-id': { type: 'string' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' }
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
