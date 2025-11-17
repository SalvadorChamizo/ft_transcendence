import { getResultsByUserId , addVictoryForUserId, addDefeatForUserId } from "../repositories/matchResultRepository";

export async function getResults(userId: number) {
    return getResultsByUserId(userId);
}

export async function addVictory(userId: number) {
    return addVictoryForUserId(userId);
}

export async function addDefeat(userId: number) {
    return addDefeatForUserId(userId);
}