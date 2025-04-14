import { Server } from "socket.io";
import http from "http";
import express from "express";

import {
    UsersState,
    buildMsg,
    activateUser,
    userLeavesApp,
    getUser,
    getUsersInRoom,
    getAllActiveRooms,
} from "./roomManager.js";

const app = express();
const server = http.createServer(app);

const ADMIN = "Admin";

const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === "production" ? false : ["http://localhost:5173", "http://127.0.0.1:5173"]
    }
});

io.on('connection', socket => {
    console.log(`User ${socket.id} connected`);

    // Användaren ansluter till ett rum
    socket.on('enterRoom', ({ name, room }) => {
        console.log(`User ${name} with socket ID ${socket.id} joined room ${room}`);

        // Kontrollera om användaren redan finns i samma rum
        const existingUser = UsersState.users.find(u => u.name === name && u.room === room);

        if (existingUser) {
            console.log(`User ${name} refreshed in room ${room}, skipping duplicate join message`);
            socket.join(room);
            return; // Användaren är redan i rummet, så vi undviker dubbla meddelanden
        }

        // Aktivera användaren i det nya rummet
        const user = activateUser(socket.id, name, room);
        socket.join(user.room);

        // Skicka meddelanden om att användaren gått med i rummet
        socket.emit('message', buildMsg(ADMIN, `Ansluten till rum ${user.room}`));
        socket.broadcast.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} har gått med i rummet`));

        // Uppdatera användarlistan och rumslistan
        io.to(user.room).emit('userList', { users: getUsersInRoom(user.room) });
        io.emit('roomList', { rooms: getAllActiveRooms() });

        // Skicka initial video state till den nya användaren
        const userState = getUser(socket.id);
        if (userState) {
            socket.emit('initialState', {
                currentTime: userState.videoTime || 0,
                isPlaying: userState.isPlaying || false
            });
        }
    });

    // När användaren kopplar bort sig
    socket.on('disconnect', () => {
        const user = getUser(socket.id);

        if (!user) {
            console.log(`User ${socket.id} already removed`);
            return; // Användaren är redan borttagen
        }

        userLeavesApp(socket.id);

        io.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} har lämnat rummet`));
        io.to(user.room).emit('userList', {
            users: getUsersInRoom(user.room),
        });

        io.emit('roomList', {
            rooms: getAllActiveRooms(),
        });

        console.log(`User ${socket.id} disconnected`);
    });

    // När användaren lämnar ett rum
    socket.on('leaveRoom', ({ name, room }) => {
        console.log(`Received leaveRoom event: ${name} is leaving room ${room}`);

        const user = getUser(socket.id);

        if (user) {
            userLeavesApp(socket.id);
            socket.leave(room);

            io.to(room).emit('message', buildMsg(ADMIN, `${name} har lämnat rummet`));
            io.to(room).emit('userList', {
                users: getUsersInRoom(room),
            });

            console.log(`User ${name} left room ${room}`);
        }
    });

    // När ett meddelande skickas
    socket.on('message', ({ name, text }) => {
        const room = getUser(socket.id)?.room;
        if (room) {
            io.to(room).emit('message', buildMsg(name, text)); // Skickar meddelandet till alla användare i rummet
        }
    });

    // När en användare skriver
    socket.on('activity', (name) => {
        const room = getUser(socket.id)?.room;
        if (room) {
            socket.broadcast.to(room).emit('activity', name); // Skickar till alla andra i rummet
        }
    });


    // När användaren skickar en uppdatering av videons tid
    socket.on('syncTime', (time) => {
        const user = getUser(socket.id);
        if (user) {
            // Skicka tiden till alla andra användare i samma rum
            user.videoTime = time;
            socket.broadcast.to(user.room).emit('syncTime', time);
        }
    });

    // Skicka play/pause-meddelande till alla andra klienter
    socket.on('togglePlayPause', (isPlaying) => {
        const user = getUser(socket.id);
        if (user) {
            user.isPlaying = isPlaying;
        }

        // Skicka till alla andra än den som skickade
        socket.broadcast.emit('togglePlayPause', isPlaying);
    });
});

export { io, app, server };
