# Project Structure

This service follows a clean, modular architecture to keep code maintainable and consistent across all microservices.

```
src/
index.ts
routes/
controllers/
services/
db/
utils/
.env.example
Dockerfile
```


---

## Folder & File Purpose

### **src/**
Root folder for all application source code.  
Everything related to running the service lives here — keeping it separate from config, build files, and Docker setup.

---

### **src/index.ts**
Entrypoint of the service.
- Boots the HTTP/WebSocket server.
- Loads environment variables (`.env`).
- Registers routes and middleware.
- Starts listening on the configured port.

In microservices, each service has its own `index.ts` so it can run independently.

---

### **src/routes/**
Contains API route definitions.
- Each file corresponds to a route group (e.g., `auth.ts`, `game.ts`, `chat.ts`).
- Defines URL paths and HTTP methods, but keeps the logic out of here.
- Routes delegate to controllers.

**Example:**  
`routes/user.ts` → defines `/users` GET/POST/PUT endpoints.

---

### **src/controllers/**
Holds request handler functions.
- Receives input from routes.
- Validates request parameters/body.
- Calls the relevant service to execute business logic.
- Returns the HTTP response.

This keeps HTTP concerns (request/response handling) separate from business rules.

---

### **src/services/**
Contains business logic.
- Implements the actual operations of the service (e.g., matchmaking, chat message saving, JWT generation).
- Does not care about HTTP or the web — can be reused in CLI tools, tests, or WebSocket events.
- Often interacts with the **db** layer.

---

### **src/db/**
Manages data storage and retrieval.
- Database connection configuration.
- Query builders or ORM models.
- Migrations (if used).
- Keeps all persistence logic isolated so it’s easy to switch DB engines or mock in tests.

---

### **src/utils/**
Small, reusable helper functions.
- Logging setup.
- Data formatting.
- Input sanitization.
- Error handling utilities.

These are shared across routes, controllers, and services.

---

### **.env.example**
Template for environment variables.
- Lists required configuration keys (`PORT`, `DB_PATH`, `JWT_SECRET`, etc.).
- Never contains real secrets — only placeholder values.
- Developers copy this to `.env` and fill in local/production values.

---

### **Dockerfile**
Build instructions for running this service in a container.
- Defines base image (e.g., Node.js).
- Installs dependencies.
- Copies source code.
- Exposes the service’s port.
- Sets the startup command.

Each microservice has its own `Dockerfile` so it can be deployed independently.
