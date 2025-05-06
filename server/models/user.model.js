import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
        },
        lastName: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            match: [/.+@.+\..+/, "Please enter a valid email address"],
        },
        password: {
            type: String,
            required: true,
        },
        ticketNumber: {
            type: [String], // Array av strängar
        },
    },
    { timestamps: true }
);

// Hasha lösenord innan sparning
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const bcrypt = await import("bcryptjs");
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model("User", userSchema);

export default User;