import { createUser } from "../repositories/userRepository";
import { sendNotification } from "./notification";

export async function findOrCreateUserFrom42(intraUser: any) {
    const username = intraUser.login;
    const email = intraUser.email;

    const res = await fetch("http://user-management-service:8082/getUserByName", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
    });

    if (res.ok) {
        const user = await res.json();
        return user;
    }

    const register = await fetch("http://user-management-service:8082/register42", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email }),
    });

    if (!register.ok) {
        const errorText = await register.text();
        throw new Error(`Failed to create user from 42 login: ${errorText}`);
    }
    
    const newUser = await register.json();
    const  id = createUser();
    await sendNotification(Number(id), "Welcome to Ft_Transcendence", `Hello ${username}! Thank you for registering in our project!`);
    return newUser.user;
}

export async function findOrCreateUserFromGoogle(googleUser: any) {
    const email = googleUser.email;
    const username = googleUser.name;
    console.log(`Username google: ${username}`);
    const res = await fetch("http://user-management-service:8082/getUserByEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
    });

    if (res.ok) {
        const user = await res.json();
        return user;
    }

    const register = await fetch("http://user-management-service:8082/register42", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email }),
    });

    if (!register.ok) {
        const errorText = await register.text();
        throw new Error(`Failed to create user from Google login: ${errorText}`);
    }
    
    const newUser = await register.json();
    const  id = createUser();
    await sendNotification(Number(id), "Welcome to Ft_Transcendence", `Hello ${username}! Thank you for registering in our project!`);
    return newUser.user;
}