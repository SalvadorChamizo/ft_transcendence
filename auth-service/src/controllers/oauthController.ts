import { FastifyRequest, FastifyReply } from "fastify";
import { findOrCreateUserFrom42, findOrCreateUserFromGoogle } from "../services/oauthService";
import { createTokensLogin } from "../services/authService";

export async function login42Controller(req: FastifyRequest, reply: FastifyReply) {
    const clientId = process.env.FORTY_TWO_CLIENT_ID;
    const redirectUri = process.env.FORTY_TWO_REDIRECT_URI;
    const encodedRedirectUri = encodeURIComponent(redirectUri);
    const scope = "public";

    const url = `https://api.intra.42.fr/oauth/authorize?client_id=${clientId}&redirect_uri=${encodedRedirectUri}&response_type=code&scope=${scope}`;

    return reply.redirect(url);
}

export async function callback42Controller(req: FastifyRequest, reply: FastifyReply) {
    const { code, error, error_description } = req.query as { 
        code?: string; 
        error?: string; 
        error_description?: string; 
    };

    const frontendRedirectBase = `${process.env.FRONTEND_REDIRECT_IP}/#/login`;

    if (error) {
        console.warn("42 OAuth cancelled or failed:", error, error_description);

        const redirectUrl = new URL(frontendRedirectBase);
        redirectUrl.searchParams.set("error", error);
        if (error_description) {
            redirectUrl.searchParams.set("error_description", error_description);
        }

        return reply.redirect(redirectUrl.toString());
    }

    if (!code) {
        const redirectUrl = new URL(frontendRedirectBase);
        redirectUrl.searchParams.set("error", "missing_code");

        return reply.redirect(redirectUrl.toString());
    }

    try {
        const redirectUri = process.env.FORTY_TWO_REDIRECT_URI;

        const tokenRes = await fetch("https://api.intra.42.fr/oauth/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                client_id: process.env.FORTY_TWO_CLIENT_ID!,
                client_secret: process.env.FORTY_TWO_CLIENT_SECRET!,
                code,
                redirect_uri: redirectUri,
            }),
        });

        if (!tokenRes.ok) {
            const err = await tokenRes.text();
            throw new Error(`Failed to fetch token: ${err}`);
        }

        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        const userRes = await fetch("https://api.intra.42.fr/v2/me", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!userRes.ok) {
            const err = await userRes.text();
            throw new Error(`Failed to fetch user profile: ${err}`);
        }

        const intraUser = await userRes.json();

        const user = await findOrCreateUserFrom42(intraUser);

        const { token, refreshToken } = createTokensLogin(user);

        reply.setCookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            path: "/",
            maxAge: 7 * 24 * 60 * 60,
        });

        return reply.redirect(`${process.env.FRONTEND_REDIRECT_IP}/#/`);
    
    } catch (err: any) {
        console.error("42 OAuth error:", err);
        return reply.code(500).send({ error: "42 login failed" });
    }
}

export async function loginGoogleController(req: FastifyRequest, reply: FastifyReply) {
    const redirectUri = encodeURIComponent(process.env.GOOGLE_REDIRECT_URI);
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const scope = encodeURIComponent("profile email");

    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

    return reply.redirect(url);
}

export async function callbackGoogleController(req: FastifyRequest, reply: FastifyReply) {
    const { code, error, error_description } = req.query as { 
        code?: string;
        error?: string;
        error_description?: string;
    };

    const frontendRedirectBase = "https://localhost:8443/#/login"; // Adjust if needed

    if (error) {
        console.warn("Google OAuth cancelled or failed:", error, error_description);

        const redirectUrl = new URL(frontendRedirectBase);
        redirectUrl.searchParams.set("error", error);
        if (error_description) {
            redirectUrl.searchParams.set("error_description", error_description);
        }

        return reply.redirect(redirectUrl.toString());
    }

    if (!code) {
        const redirectUrl = new URL(frontendRedirectBase);
        redirectUrl.searchParams.set("error", "missing_code");

        return reply.redirect(redirectUrl.toString());
    }

    try {
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
                grant_type: "authorization_code"
            })
        });

        if (!tokenRes.ok) {
        const errBody = await tokenRes.text();
        console.error("Token exchange failed:", tokenRes.status, errBody);
        throw new Error(`Failed to exchange code for token: ${errBody}`);
        }

        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        if (!userInfoRes.ok) {
        const errBody = await userInfoRes.text();
        console.error("User info fetch failed:", userInfoRes.status, errBody);
        throw new Error(`Failed to fetch user profile: ${errBody}`);
        }

        const googleUser = await userInfoRes.json();
        const user = await findOrCreateUserFromGoogle(googleUser);

        const { token, refreshToken } = createTokensLogin(user);

        reply.setCookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            path: "/",
            maxAge: 7 * 24 * 60 * 60,
        });

        return reply.redirect("https://localhost:8443/#/");

    } catch (err) {
        console.error("Google OAuth error:", err);
        return reply.code(500).send({ error: "Google login failed" });
    }
}