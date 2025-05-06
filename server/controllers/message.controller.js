import Message from "../models/message.model.js";
import User from "../models/user.model.js";

export const sendMessage = async (req, res) => {
    try {
        const { userId, text, roomId } = req.body;

        // Skicka INTE in admin/systemmeddelanden till Message.create eller new Message
        if (userId === "Admin") return; // eller liknande kontroll

        const newMessage = new Message({
            senderId: userId, // ändra här
            roomId,
            text
        });

        await newMessage.save();

        res.status(201).json(newMessage);
    } catch (error) {
        console.log("Error in sendMessage controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getMessagesByRoomId = async (req, res) => {
    try {
        const { roomId } = req.params;
        const messages = await Message.find({ roomId }).sort({ createdAt: 1 }).lean();

        // Lägg till namn till varje meddelande
        const messagesWithNames = await Promise.all(messages.map(async msg => {
            const user = await User.findById(msg.senderId).lean();
            return {
                ...msg,
                firstName: user?.firstName || "",
                lastName: user?.lastName || "",
            };
        }));

        res.status(200).json(messagesWithNames);
    } catch (error) {
        console.log("Error in getMessagesByRoomId controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};