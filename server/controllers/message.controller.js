import Message from "../models/message.model.js";


export const sendMessage = async (req, res) => {
    try {
        const { name, text, roomId } = req.body;

        const newMessage = new Message({
            senderName: name,
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

        const messages = await Message.find({ roomId }).sort({ createdAt: 1 }); // Hämtar meddelanden och sorterar efter skapelsedatum

        res.status(200).json(messages);
    } catch (error) {
        console.log("Error in getMessagesByRoomId controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};