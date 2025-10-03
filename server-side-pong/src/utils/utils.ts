/**
 * @file ustils.ts
 * @brief Tools for generating unique ids
 */
import { v4 as uuidv4 } from "uuid";

/**
 * @brief Generates a new unique id 
 * Uses the UUID v4: universally unique identifier randomly generated
 * @returns {string} Unique id
 */
export const newId = () => uuidv4();
