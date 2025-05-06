import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        senderId: { type: String, required: true }, // ändra här
        roomId: { type: String, required: true },
        text: { type: String, required: true }
    },
    { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;