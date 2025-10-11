/**
 * Authentication utilities for chat-service
 * Extracts user information from headers passed by the Gateway
 */

/**
 * Extracts and validates user ID from request headers
 * The Gateway passes the authenticated user's ID via x-user-id header
 * 
 * @param headers - Request headers object
 * @returns User ID as number
 * @throws Error if user is not authenticated or ID is invalid
 */
export function extractUserId(headers: any): number {
    const userId = headers['x-user-id'];
    
    if (!userId) {
        throw new Error('User not authenticated');
    }
    
    const id = parseInt(userId);
    
    if (isNaN(id)) {
        throw new Error('Invalid user ID');
    }
    
    return id;
}

/**
 * Extracts username from request headers (optional)
 * 
 * @param headers - Request headers object
 * @returns Username as string or undefined
 */
export function extractUsername(headers: any): string | undefined {
    return headers['x-username'];
}
