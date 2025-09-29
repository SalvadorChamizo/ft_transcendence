import { getVictoriesByUserId , addVictoryForUserId } from "../repositories/matchResultRepository";

export async function getVictories(userId: number) {
    return getVictoriesByUserId(userId);
}

export async function addVictory(userId: number) {
    return addVictoryForUserId(userId);
}
