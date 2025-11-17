import { 
    findAllUsers,
    getFriends,
    addFriend,
    removeFriend,
    checkFriend
} from "../repositories/friendsRepository";

export async function getAllUsersService() {
    return findAllUsers();
}

export async function getFriendsService(userId: number) {
    return getFriends(userId);
}

export async function addFriendService(userId: number, friendId: number) {
    return addFriend(userId, friendId);
}

export async function removeFriendService(userId: number, friendId: number) {
    return removeFriend(userId, friendId);
}

export async function checkFriendService(userId: number, friendId: number) {
    return checkFriend(userId, friendId);
}