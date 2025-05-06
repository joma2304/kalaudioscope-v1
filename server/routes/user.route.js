import express from "express";
import {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    loginUser,
} from "../controllers/user.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/user", createUser); // Skapa en ny användare
router.post("/user/login", loginUser); // Logga in en användare

router.get("/user", authenticateToken, getAllUsers); // Hämta alla användare
router.get("/user:id", authenticateToken, getUserById); // Hämta en användare baserat på ID
router.put("/user/:id", authenticateToken, updateUser); // Uppdatera en användare
router.delete("/user/:id", authenticateToken, deleteUser); // Ta bort en användare


export default router;