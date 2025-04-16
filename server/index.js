import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { connectDB } from './lib/db.js'
import { server, app } from "./lib/socket.js";
import cors from 'cors'

import messageRoutes from './routes/messages.route.js';
import roomsRoutes from './routes/rooms.route.js'; 

dotenv.config();
app.use(express.json());


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 3500



app.use(express.static(path.join(__dirname, "public")));

app.use(
    cors({
        origin: ["http://localhost:5173", "http://127.0.0.1:5173"],    
    })
);

app.use("/api", messageRoutes);
app.use("/api", roomsRoutes); // 

server.listen(PORT, () => {
    console.log('Server is running on PORT:' + PORT);
    connectDB()
});

