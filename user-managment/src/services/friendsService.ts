import { findAllUsers } from "../repositories/friendsRepository";

export async function getAllUsersService() {
    return findAllUsers();
}