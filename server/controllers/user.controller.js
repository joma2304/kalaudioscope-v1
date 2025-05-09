import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"; // För att generera JWT-token


// Skapa en ny användare
export const createUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        // Kontrollera om e-post redan finns
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        // Skapa användare
        const newUser = new User({ firstName, lastName, email, password });
        await newUser.save();

        res.status(201).json({ message: "User created successfully", user: newUser });
    } catch (error) {
        res.status(500).json({ message: "Error creating user", error: error.message });
    }
};

// Hämta alla användare
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, "firstName lastName"); // Hämta endast specifika fält
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users", error: error.message });
    }
};

// Hämta en användare baserat på ID
export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.user.id); // Hämta användaren baserat på ID från token

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            ticketNumber: user.ticketNumber,
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching user", error: error.message });
    }
};

// Uppdatera en användare
export const updateUser = async (req, res) => {
    try {
        const { firstName, lastName, email, oldPassword, password } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Kontrollera att gamla lösenordet är korrekt
        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Incorrect current password" });
        }

        // Uppdatera fält
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (email) user.email = email;
        if (password) user.password = password; // Kommer att hash:as av pre-save-hook

        await user.save();

        res.status(200).json({ message: "User updated successfully", user });
    } catch (error) {
        res.status(500).json({ message: "Error updating user", error: error.message });
    }
};

// Ta bort en användare
export const deleteUser = async (req, res) => {
    try {
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ message: "Password required" });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Incorrect password" });
        }

        await User.findByIdAndDelete(req.user.id);

        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting user", error: error.message });
    }
};

// Logga in en användare
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Kontrollera om användaren finns
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Kontrollera lösenord
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Incorrect password" });
        }

        // Generera en JWT-token
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET || "your_jwt_secret", // Använd en miljövariabel för säkerhet
            { expiresIn: "5h" } // Token giltig i 1 timme
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                ticketNumber: user.ticketNumber,
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Error logging in", error: error.message });
    }
};