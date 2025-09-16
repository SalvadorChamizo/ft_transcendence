import { FastifyInstance } from "fastify";
import * as websocketService from "../services/websocketService";

export async function websocketRoutes(fastify: FastifyInstance) {
    fastify.register(async function (fastify) {
        fastify.get('/ws', { websocket: true }, (connection, req) => {
            console.log('WebSocket connection established');

            // 1. EXTRACT userId from query string with proper typing
            const query = req.query as { userId?: string };
            const userId = parseInt(query.userId || '');

            // 2. VALIDATE userId
            if (!userId || isNaN(userId)) {
                console.error('Invalid userId provided in WebSocket connection');
                connection.close(1008, 'Invalid userId'); // Policy Violation
                return;
            }

            console.log(`User ${userId} attempting to connect via WebSocket`);

            // 3. HANDLE CONNECTION - Register user
            try {
                websocketService.handleWebSocketConnection(connection);
                websocketService.addUserConnection(userId, connection);
                console.log(`User ${userId} successfully connected via WebSocket`);
            } catch (error) {
                console.error(`Failed to register WebSocket connection for user ${userId}:`, error);
                connection.close(1011, 'Connection registration failed');
                return;
            }

            // 4. HANDLE MESSAGES - Process incoming JSON messages
            connection.on('message', (rawMessage: any) => {
                try {
                    // Parse the JSON message
                    const messageString = rawMessage.toString();
                    const message = JSON.parse(messageString);

                    // Validate message structure
                    if (!message.type || !message.payload) {
                        console.error(`Invalid message format from user ${userId}:`, message);
                        connection.send(JSON.stringify({
                            type: 'error',
                            payload: { message: 'Invalid message format. Expected: {type, payload}' }
                        }));
                        return;
                    }

                    console.log(`Received message from user ${userId}:`, message.type);

                    // Process the message through WebSocket service
                    websocketService.handleWebSocketMessage(connection, message);

                } catch (error) {
                    console.error(`Error processing message from user ${userId}:`, error);
                    connection.send(JSON.stringify({
                        type: 'error',
                        payload: { message: 'Failed to process message' }
                    }));
                }
            });

            // 5. HANDLE CLOSE - Clean up when connection closes
            connection.on('close', () => {
                try {
                    console.log(`User ${userId} disconnected from WebSocket`);
                    websocketService.handleWebSocketDisconnection(connection);
                    websocketService.removeUserConnection(userId);
                    console.log(`Successfully cleaned up connection for user ${userId}`);
                } catch (error) {
                    console.error(`Error during cleanup for user ${userId}:`, error);
                }
            });

            // 6. HANDLE ERRORS - Log and clean up on errors
            connection.on('error', (error: Error) => {
                console.error(`WebSocket error for user ${userId}:`, error);
                try {
                    websocketService.removeUserConnection(userId);
                } catch (cleanupError) {
                    console.error(`Error during error cleanup for user ${userId}:`, cleanupError);
                }
            });
        });
    });
}