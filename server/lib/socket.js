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

// Rumstillstånd
const roomControllers = {}; // Key: room, Value: socket ID of controller
const roomMaxLimits = {};   // Key: room, Value: max user limit
const roomPasswords = {};   // Key: room, Value: password

// Funktion för att uppdatera och skicka rumsstatus
const updateRoomList = () => {
    const roomList = getAllActiveRooms().map((room) => ({
        name: room,
        userCount: getUsersInRoom(room).length,
        maxUsers: roomMaxLimits[room] || null,
        hasPassword: !!roomPasswords[room],
    }));
    io.emit('roomList', roomList);
};

// Funktion för att hantera rumsrelaterade händelser
const handleRoomEvents = (socket, user, room) => {
    socket.emit('message', buildMsg(ADMIN, `Welcome ${user.name}`));
    socket.broadcast.to(room).emit('message', buildMsg(ADMIN, `${user.name} has connected`));

    // Uppdatera användarlistan för alla användare i rummet
    io.to(room).emit('roomUsers', {
        users: getUsersInRoom(room).map(u => ({ name: u.name }))
    });

    updateRoomList();
};

// När en användare ansluter
io.on('connection', (socket) => {
    console.log(`User ${socket.id} connected`);

    socket.on("requestRoom", ({ name, maxUsers, password }, callback) => {
        const existingRooms = getAllActiveRooms();
        let roomName = "0";

        // Generera ett unikt rumsnamn
        while (existingRooms.includes(roomName)) {
            roomName = (parseInt(roomName) + 1).toString();
        }

        // Kontrollera om rummet redan är fullt
        const userCount = getUsersInRoom(roomName).length;
        if (maxUsers && userCount >= maxUsers) {
            callback({ success: false, message: "Room is full" });
            return;
        }

        // Skapa rummet och aktivera användaren
        socket.join(roomName, name);
        const user = activateUser(socket.id, name, roomName);

        // Lägg till eventuella gränser för användare och lösenord
        if (maxUsers) roomMaxLimits[roomName] = maxUsers;
        if (password) roomPasswords[roomName] = password;

        callback({ success: true, roomName });
        updateRoomList();

        // Skicka meddelande om att ett nytt rum har skapats
        io.to(roomName).emit('message', buildMsg(ADMIN, `${name} has created the room.`));

        // Gör användaren till kontrollansvarig om de är den första i rummet
        if (user.isController) {
            socket.emit('youAreNowController');
        }
    });

    socket.on('enterRoom', ({ name, room, password }) => {
        const existingUser = getUser(socket.id);
        if (existingUser) return;

        // Kontrollera lösenord om nödvändigt
        if (roomPasswords[room] && roomPasswords[room] !== password) {
            socket.emit('message', buildMsg(ADMIN, 'Incorrect password.'));
            return;
        }

        const user = activateUser(socket.id, name, room);
        socket.join(user.room);

        // Hantera användaranslutning
        handleRoomEvents(socket, user, user.room);

        // Uppdatera användarlistan omedelbart
        io.to(room).emit('roomUsers', {
            users: getUsersInRoom(room).map(u => ({ name: u.name }))
        });

        // Meddela om kontrollansvarig
        if (user.isController) {
            socket.emit('youAreNowController');
        }
    });

    socket.on("setRoomLimit", ({ room, maxUsers }, callback) => {
        const user = getUser(socket.id);
        if (!user || user.room !== room) {
            return callback({ success: false, message: "You are not in this room." });
        }
        if (maxUsers <= 0) {
            return callback({ success: false, message: "Max users must be greater than 0." });
        }
        roomMaxLimits[room] = maxUsers;
        callback({ success: true, message: `Max user limit set to ${maxUsers} for room ${room}.` });
    });

    socket.on("getRoomList", () => {
        updateRoomList();
    });

    socket.on('leaveRoom', ({ name, room }) => {
        const user = getUser(socket.id);
        if (user) {
            const newController = userLeavesApp(socket.id);

            socket.leave(room);

            // Skicka meddelande om att användaren har lämnat
            io.to(room).emit('message', buildMsg(ADMIN, `${name} has left.`));

            // Uppdatera användarlistan för alla kvarvarande användare
            io.to(user.room).emit('roomUsers', {
                users: getUsersInRoom(user.room).map(user => ({ name: user.name }))
            });

            updateRoomList();

            // Om användaren var kontrollansvarig, överför kontroll till en annan användare
            if (newController) {
                io.to(newController.id).emit('youAreNowController');
                io.to(room).emit('message', buildMsg(ADMIN, `${newController.name} is now in control.`));
            }
        }
    });

    socket.on('disconnect', () => {
        const user = getUser(socket.id);
        if (!user) return;

        userLeavesApp(socket.id);

        socket.broadcast.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} has left`));
        io.to(user.room).emit('roomUsers', {
            users: getUsersInRoom(user.room).map(u => ({ name: u.name }))
        });

        updateRoomList();

        const users = getUsersInRoom(user.room);
        const newController = users.find(u => u.isController);
        if (newController) {
            io.to(newController.id).emit('youAreNowController');
        }
    });

    socket.on('message', ({ name, text }) => {
        const room = getUser(socket.id)?.room;
        if (room) {
            io.to(room).emit('message', buildMsg(name, text));
        }
    });

    socket.on('activity', (name) => {
        const room = getUser(socket.id)?.room;
        if (room) {
            socket.broadcast.to(room).emit('activity', name);
        }
    });

    // Video-synk
    socket.on('syncTime', (time) => {
        const user = getUser(socket.id);
        if (user && user.isController) {
            user.videoTime = time;
            socket.broadcast.to(user.room).emit('syncTime', time);
        }
    });

    socket.on('togglePlayPause', (isPlaying) => {
        const user = getUser(socket.id);
        if (user && user.isController) {
            user.isPlaying = isPlaying;
            socket.broadcast.to(user.room).emit('togglePlayPause', isPlaying);
        }
    });
});

export { io, app, server };
