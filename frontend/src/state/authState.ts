let accessToken: string | null = null;

export let tempToken = "";
export let tempUserId = 0;
export let tempUsername = "";

export function setTemp2FA(token: string, username: string, userId: number) {
    tempToken = token;
    tempUsername = username;
    tempUserId = userId;
}

export function setAccessToken(token: string) {
    accessToken = token;
}

export function getAccessToken(): string | null {
    return (accessToken);
}

export function isLoggedIn(): boolean {
    return (accessToken !== null);
}

export function clearAuth() {
    accessToken = null;
}

export function getUserIdFromToken(): number | null {
    if (!accessToken) return null;
    
    try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        return payload.id || null;
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
}

export async function refreshAccessToken(): Promise<boolean> {

    try {
        const res = await fetch("http://localhost:8080/auth/refresh", {
            method: "POST",
            credentials: "include",
        });
    
    if (!res.ok) {
        console.log("Entra");
        clearAuth();
        return (false);
    }

    const data = await res.json();
    if (data.accessToken) {
        setAccessToken(data.accessToken);
        return (true);
    }

    clearAuth();
    return (false);
    } catch (err) {
        clearAuth();
        return (false);
    }
}