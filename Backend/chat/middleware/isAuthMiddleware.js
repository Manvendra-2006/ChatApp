import jwt from "jsonwebtoken";

export function isAuth(req, resp, next) {
    try {
        const token =
            req.cookies?.token ||
            req.headers.authorization?.split(" ")[1];

        if (!token) {
            return resp.status(401).json({
                message: "Token Required"
            });
        }

        const isUser = jwt.verify(
            token,
            process.env.JWT_TOKEN
        );

        req.user = isUser;

        next();
    } catch (error) {
        return resp.status(401).json({
            message: "Invalid or expired token"
        });
    }
}

export default isAuth;