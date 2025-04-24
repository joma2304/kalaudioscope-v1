import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        senderName: { type: String, required: true },
        roomId: { type: String, required: true },
        text: { type: String, required: true }
        // ticketNumber är borttagen
    },
    { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;