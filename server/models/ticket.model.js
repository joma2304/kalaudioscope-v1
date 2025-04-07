import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
    {
        ticketNumber: {
            type: String,
            required: true,
            unique: true,
        }
    }, {
    timestamps: true,
});

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;