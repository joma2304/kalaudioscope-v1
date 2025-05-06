import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; // Hämta token från Authorization-headern
    if (!token) {
        return res.status(401).json({ message: "Access denied, no token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
        req.user = decoded; // Lägg till användarens ID och e-post i req.user
        next();
    } catch (error) {
        res.status(403).json({ message: "Invalid token" });
    }
};