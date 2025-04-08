import Message from "../models/message.model.js";


export const sendMessage = async (req, res) => {
    try {
        const { name, text, ticketNumber, roomId } = req.body;

        const newMessage = new Message({
            senderName: name,
            ticketNumber,
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
