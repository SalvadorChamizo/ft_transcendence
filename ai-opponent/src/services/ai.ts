import { Ball, AIKeyEvent, AIActionResponse } from '../utils/types';

function mod(n: number, m: number) { return ((n % m) + m) % m; }


/**
 * Predicts the Y position of the ball when it reaches targetX, considering bounces.
 * Returns null if the ball is not moving towards targetX.
 */
export function predictBallY(ball: Ball, fieldHeight: number, targetX: number): number | null
{
    console.log(`[AI] predictBallY called with: ball=`, ball, `fieldHeight=${fieldHeight}`, `targetX=${targetX}`);
    if (ball.dx === 0) {
        console.log('[AI] Ball not moving in X axis, prediction not possible.');
        return null;
    }
    const t = (targetX - ball.x) / ball.dx;
    console.log(`[AI] Time to reach targetX: ${t}`);
    if (t <= 0) {
        console.log('[AI] Ball is moving away from targetX, prediction not possible.');
        return null;
    }

    let predictedY = ball.y + ball.dy * t;
    console.log(`[AI] Predicted Y without bounces: ${predictedY}`);
    const period = 2 * fieldHeight;
    predictedY = mod(predictedY, period);
    if (predictedY > fieldHeight) predictedY = period - predictedY;
    console.log(`[AI] Final predicted Y with bounces: ${predictedY}`);
    return predictedY;
}

/**
 * Generates a sequence of keyboard events to move the paddle for a given interval (dtSeconds).
 * This acts as a "planner" for the next second.
 */
export function computeAIKeyEvents(
    paddleCenter: number,
    paddleHeight: number,
    ball: Ball,
    fieldHeight: number,
    targetX: number,
    paddleSpeed: number, // px per second
    dtSeconds = 1.0,
    aimBias = 0,
    mistakeProb = 0.08
): AIActionResponse {
    console.log(`[AI] computeAIKeyEvents called with: paddleCenter=${paddleCenter}, paddleHeight=${paddleHeight}, ball=`, ball, `fieldHeight=${fieldHeight}, targetX=${targetX}, paddleSpeed=${paddleSpeed}, dtSeconds=${dtSeconds}, aimBias=${aimBias}, mistakeProb=${mistakeProb}`);
    const events: AIKeyEvent[] = [];
    let mistakeMade = false;

    // 1. Predicts the ball and movement target
    console.log('[AI] Predicting ball position...');
    const predictedY = predictBallY(ball, fieldHeight, targetX);
    // If we can't predict (ball moving away or stationary), choose a defensive target.
    // Previously we aimed at the center; change to track the ball's Y so the paddle repositions
    // defensively (preparing for return) even when the ball is not heading towards the paddle.
    const targetY = (predictedY === null ? ball.y : predictedY) + aimBias;
    console.log(`[AI] Predicted Y: ${predictedY}, Target Y: ${targetY}`);

    // 2. Calculate the necessary movement
    const diff = targetY - paddleCenter;
    const distanceToMove = Math.abs(diff);
    console.log(`[AI] Movement needed: diff=${diff}, distance=${distanceToMove}`);

    // If no movement is needed, do nothing
    if (distanceToMove < 5)
    {
        console.log('[AI] No significant movement needed.');
        return { events, debug: { predictedY, targetY, paddleCenterBefore: paddleCenter, paddleCenterAfter: paddleCenter, mistakeMade: false } };
    }

    // Borders checking to prevent the paddle from getting stuck
    const paddleTopY = paddleCenter - paddleHeight / 2;
    const paddleBottomY = paddleCenter + paddleHeight / 2;
    const moveDirection: 'up' | 'down' = diff < 0 ? 'up' : 'down';
    console.log(`[AI] Move direction: ${moveDirection}`);
    const BORDER_TOLERANCE = 5;

    if (moveDirection === 'up' && paddleTopY <= BORDER_TOLERANCE) {
        console.log('[AI] At top border, not moving up.');
        return { events, debug: { predictedY, targetY, paddleCenterBefore: paddleCenter, paddleCenterAfter: paddleCenter, mistakeMade: false } };
    }
    if (moveDirection === 'down' && paddleBottomY >= fieldHeight - BORDER_TOLERANCE) {
        console.log('[AI] At bottom border, not moving down.');
        return { events, debug: { predictedY, targetY, paddleCenterBefore: paddleCenter, paddleCenterAfter: paddleCenter, mistakeMade: false } };
    }

    // 3. Calculate the time needed for the movement
    // Time (s) = Distance (px) / Speed (px/s)
    const timeNeededSeconds = distanceToMove / paddleSpeed;
    console.log(`[AI] Time needed for movement: ${timeNeededSeconds}s`);

    // The movement time cannot be greater than the decision interval
    const moveDurationSeconds = Math.min(timeNeededSeconds, dtSeconds);
    let moveDurationMs = Math.round(moveDurationSeconds * 1000);
    console.log(`[AI] Planned move duration: ${moveDurationMs}ms`);

    const keyName = moveDirection === 'up' ? 'ArrowUp' : 'ArrowDown';

    // 4. Simulate human errors
    if (Math.random() < mistakeProb)
    {
        mistakeMade = true;
        // The mistake can be hesitation, moving in the wrong direction, or moving for less time
        const mistakeFactor = (0.2 + Math.random() * 0.5);
        moveDurationMs *= mistakeFactor; // Move between 20% and 70% of the needed time
        console.log(`[AI] MISTAKE MADE! New move duration: ${moveDurationMs}ms (factor: ${mistakeFactor})`);
    }

    // 5. Generate the event plan if movement is needed
    if (moveDurationMs > 50)
    { // Only generate events if the movement is significant
        console.log(`[AI] Generating key events: keydown ${keyName} at 0ms, keyup at ${moveDurationMs}ms`);
        events.push({ type: 'keydown', key: keyName, atMs: 0 }); // Start moving immediately
        events.push({ type: 'keyup', key: keyName, atMs: moveDurationMs }); // Stop moving after the calculated duration
    } else {
        console.log('[AI] Move duration too short, not generating events.');
    }

    // 6. Finalize and return the plan
    const clampedEvents = events.map(e => ({ ...e, atMs: Math.min(Math.round(dtSeconds * 1000), e.atMs) }));
    console.log('[AI] Final plan:', { events: clampedEvents, mistakeMade });

    return {
        events: clampedEvents,
        debug: {
            predictedY,
            targetY,
            paddleCenterBefore: paddleCenter,
            paddleCenterAfter: paddleCenter, // The executor will calculate the final position
            mistakeMade
        }
    } as AIActionResponse;
}