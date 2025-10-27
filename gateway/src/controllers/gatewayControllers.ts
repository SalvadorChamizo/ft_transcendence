import { FastifyRequest, FastifyReply } from "fastify";

export async function healthController(req: FastifyRequest, reply: FastifyReply) {

    const services = {
        auth: "http://auth-service:8081/health",
        user: "http://user-management-service:8082/health",
        chat: "http://chat-service:8083/health",
        pong: "http://pong-service:7000/health",
        ai: "http://ai-opponent:7010/health",
        tournament: "http://tournament-service:8085/health",
    };

    const results: Record<string, any> = {};

    await Promise.all(
        Object.entries(services).map(async ([name, url]) => {
            try {
                const start = performance.now();
                const res = await fetch(url, { method: "GET", headers: { "Content-Type": "application/json" } });
                const end = performance.now();

                if (!res.ok) {
                    results[name] = {
                        status: "error",
                        httpStatus: res.status,
                        message: res.statusText,
                    };
                    return;
                }

                const data = await res.json();
                results[name] = {
                    status: "ok",
                    responseTime: Math.round(end - start),
                    ...data,
                };
            } catch (err: any) {
                results[name] = {
                    status: "error",
                    error: err.message || "Request failed",
                };
            }
        })
    );

    const allStatus = Object.values(results).some((r: any) => r.status === "error") ? "degraded" : "ok";
    
    return reply.status(200).send({
        gateway: { status: "ok", timestamp: new Date().toISOString() },
        allStatus,
        services: results,
    });
}