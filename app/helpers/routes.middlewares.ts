import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: {
        status: 429,
        message: "Too many requests. Please try again later.",
    },
});

module.exports = {
    rateLimiter
}