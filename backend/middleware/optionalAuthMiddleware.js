
const jwt = require("jsonwebtoken");

const optionalAuthMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // No token means this is a public request.
    if (!authHeader) {
        return next();
    }

    // If a token is supplied, it must be valid.
    try {
        const parts = authHeader.split(" ");

        if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
            return res.status(401).json({
                success: false,
                message: "Invalid authorization header",
            });
        }

        const decoded = jwt.verify(
            parts[1],
            process.env.JWT_SECRET
        );

        req.user = decoded;

        return next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};

module.exports = optionalAuthMiddleware;