import { FastifyReply, FastifyRequest } from "fastify";
import { registerUser, loginUser, logoutUser, createTokensLogin, findOrCreateUserFrom42, findOrCreateUserFromGoogle } from "../services/authService";
import { rotateTokens, generateAccessToken} from "../services/tokenService"
import * as speakeasy from "speakeasy";
import { findUserById, updateUser2FA, updateUserPending2FA, getUserPending2FA, activateUser2FA, debugUsers, createUser } from "../repositories/userRepository";
import QRCode from "qrcode";


export async function registerController(req: FastifyRequest, reply: FastifyReply) {
   const { username, password, email } = req.body as { username: string; password: string; email: string };

   try {
       const result = await registerUser(username, password, email);
       return reply.send(result);
   } catch (err: any) {
        return reply.code(400).send(err.message);
   }
}

export async function loginController(req: FastifyRequest, reply: FastifyReply) {
    const { username, password } = req.body as { username: string; password: string };

    try {
        const user = await loginUser(username, password);

        if (user.is_2fa_enabled) {
            const token = generateAccessToken(user);
            return reply.send({ requires2FA: true, userId: user.id, username: user.username, tempToken: token });
        }

        const { token, refreshToken } = createTokensLogin(user);

        reply.setCookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false, //Change in future to true
            sameSite: "lax", //Change in future to strict
            path: "/auth/refresh",
            maxAge: 7 * 24 * 60 * 60,
        });

        return reply.send({ accessToken: token, user: { id: user.id, username: user.username },
        });

    } catch (err: any) {
        return reply.code(401).send({ error: err.message });
    }
}

export async function refreshController(req: FastifyRequest, reply: FastifyReply) {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return reply.code(400).send({ error: "Refresh token is required" });
    }

    try {
        const { newAccessToken, newRefreshToken } = rotateTokens(refreshToken);

        reply.setCookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/auth/refresh",
            maxAge: 7 * 24 * 60 * 60
        });

        return reply.send({
            accessToken: newAccessToken
        });

    } catch (err: any) {
        return reply.code(401).send({ error: err.message });
    }
}

export async function logoutController(req: FastifyRequest, reply: FastifyReply) {
    let refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        const authHeader = req.headers["authorization"];
        if (authHeader?.startsWith("Bearer ")) {
            refreshToken = authHeader.split(" ")[1].trim();
        }
        else
            return reply.code(400).send({ error: "Refresh token is required" });
    }

    try {
        logoutUser(refreshToken);

        reply.clearCookie("refreshToken", {
            path: "/auth/refresh",
        })

        return reply.send({ success: true, message: "Logged out successfully" });
    } catch (err) {
        return reply.code(500).send({ error: "Logout failed" });
    }
}

export async function verify2FAController(req: FastifyRequest, reply: FastifyReply) {
    const { userId, code } = req.body as { userId: number; code: string };

    const user = findUserById(userId);
    if (!user) {
        return reply.code(400).send({ error: "User not found" });
    }

    let secret = user.pending_2fa_secret || user.totp_secret;
    if (!secret) {
        return reply.code(400).send({ error: "2FA not set up" });
    }
    const verified = speakeasy.totp.verify({
        secret,
        encoding: "base32",
        token: code,
        window: 1,
    });

    if (!verified) {
        return reply.code(401).send({ error: "Invalid 2FA code" });
    }

    if (user.pending_2fa_secret) {
        activateUser2FA(userId, user.pending_2fa_secret);
        return reply.send({ success: true, message: "2FA enabled successfully" });
    }
    const { token, refreshToken } = createTokensLogin(user);
    
    reply.setCookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false, //Change in future to true
        sameSite: "lax", //Change in future to strict
        path: "/auth/refresh",
        maxAge: 7 * 24 * 60 * 60,
    });
    
    return reply.send({ accessToken: token});
}

export async function enable2FAController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { username, userId } = req.body as {username: string, userId: number};
        const secret = speakeasy.generateSecret({
            name: `ft_transcendence (${username})`,
            length: 20,
        });

        updateUserPending2FA(secret.base32, userId);
        return reply.send({ message: "2FA setup started, call /generate-qr to get qr"})

    } catch (err: any) {
        console.error("enable2FA error:", err);
        return reply.code(500).send({ error: "Failed to enable 2FA" });
    }
}

export async function generateQRController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { username, userId } = req.body as { username: string, userId: number};
        
        let secret = getUserPending2FA(userId);
        if (!secret) {
            const user = findUserById(userId);
            if (!user || !user.totp_secret) {
                return reply.code(400).send({ error: "No pending 2FA setup"});
            }
            secret = user.totp_secret;
        }

        const otpauthUrl = speakeasy.otpauthURL({
            secret: secret,
            label: `ft_transcendence`,
            issuer: "ft_transcendence",
            encoding: "base32",
        });
        
        const qr = await QRCode.toDataURL(otpauthUrl);

        return reply.send({ qr });
    } catch (err: any) {
        console.error("generateQR error:", err);
        return reply.code(500).send({ error: "Failed to generate QR"});
    }
}

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

    const frontendRedirectBase = "http://localhost:5173/#/login";

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
            secure: false,
            sameSite: "lax",
            path: "/auth/refresh",
            maxAge: 7 * 24 * 60 * 60,
        });

        return reply.redirect("http://localhost:5173/#/");
    
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

    const frontendRedirectBase = "http://localhost:5173/#/login"; // Adjust if needed

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
            secure: false,
            sameSite: "lax",
            path: "/auth/refresh",
            maxAge: 7 * 24 * 60 * 60,
        });

        return reply.redirect("http://localhost:5173/#/");

    } catch (err) {
        console.error("Google OAuth error:", err);
        return reply.code(500).send({ error: "Google login failed" });
    }
}