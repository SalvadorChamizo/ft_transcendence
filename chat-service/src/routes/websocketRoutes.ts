import { FastifyInstance } from "fastify";
import * as websocketService from "../services/websocketService";

export async function websocketRoutes(fastify: FastifyInstance) {
    fastify.register(async function (fastify) {
        fastify.get('/ws', { websocket: true }, (connection, req) => {
            console.log('WebSocket connection established');
            
            // ALL: Add connection handler
            // ALL: Add message handler  
            // ALL: Add close handler
        });
    });
}