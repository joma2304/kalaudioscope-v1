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

// Håller reda på kontrollansvarig per rum
const roomControllers = {}; // Key: room, Value: socket ID of controller
const roomMaxLimits = {}; // Key: room, Value: max user limit

io.on('connection', socket => {
    console.log(`User ${socket.id} connected`);

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

    // Skapa ett nytt rum
    socket.on("createRoom", (roomName, callback) => {
        if (!roomName || roomName.trim() === "") {
            return callback(false); // Skicka tillbaka misslyckande
        }

        const existingRooms = getAllActiveRooms();
        if (existingRooms.includes(roomName)) {
            return callback(false); // Skicka tillbaka misslyckande om rummet redan finns
        }

        // Skapa rummet
        socket.join(roomName);
        activateUser(socket.id, "Admin", roomName); // Lägg till användaren som skapade rummet
        callback(true); // Skicka tillbaka framgång

        // Uppdatera rumslistan för alla klienter
        io.emit("roomList", getAllActiveRooms().map((room) => ({
            name: room,
            userCount: getUsersInRoom(room).length,
            maxUsers: roomMaxLimits[room] || null, // Lägg till maxgränsen om den finns
        })));
    });

    // Användaren ansluter till ett rum
    socket.on('enterRoom', ({ name, room }, callback) => {

        const currentUsers = getUsersInRoom(room).length;
        const maxUsers = roomMaxLimits[room];

        // Kontrollera om rummet är fullt
        if (maxUsers && currentUsers >= maxUsers) {
            console.log(`Room ${room} is full. User ${name} cannot join.`);
            return callback && callback({ success: false, message: "Room is full." });
        }

        console.log(`User ${name} with socket ID ${socket.id} joined room ${room}`);

        // Kontrollera om användaren redan finns i samma rum
        const existingUser = UsersState.users.find(u => u.name === name && u.room === room);

        if (existingUser) {
            console.log(`User ${name} refreshed in room ${room}, skipping duplicate join message`);
            socket.join(room);
            return callback && callback({ success: true, message: "Reconnected to the room." });
        }

        // Aktivera användaren i det nya rummet
        const user = activateUser(socket.id, name, room);
        socket.join(user.room);

        // Uppdatera användarlistan för alla i rummet
        io.to(user.room).emit('userList', {
            users: getUsersInRoom(user.room),
        });

        // Skicka meddelanden om att användaren gått med i rummet
        socket.emit('message', buildMsg(ADMIN, `Connected to room ${user.room}`));
        socket.broadcast.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} has joined`));

        // Uppdatera rumslistan för alla klienter
        io.emit("roomList", getAllActiveRooms().map((room) => ({
            name: room,
            userCount: getUsersInRoom(room).length,
            maxUsers: roomMaxLimits[room] || null, // Lägg till maxgränsen om den finns
        })));

        // Skicka initial video state till den nya användaren
        const userState = getUser(socket.id);
        if (userState) {
            socket.emit('initialState', {
                currentTime: userState.videoTime || 0,
                isPlaying: userState.isPlaying || false
            });
        }

        // Skicka nuvarande kontrollansvarig till den nya användaren
        const controllerId = roomControllers[user.room];
        if (controllerId === socket.id) {
            socket.emit('youAreNowController');
        }

        // Om ingen är kontrollansvarig, gör den här användaren till kontrollansvarig
        if (!controllerId) {
            roomControllers[user.room] = socket.id; // Den här användaren blir kontrollansvarig
            socket.emit('youAreNowController');
        }

        // Anropa callback för att indikera framgång
        return callback && callback({ success: true, message: "Joined the room successfully." });
    });

    socket.on("requestRoom", ({ name }, callback) => {
        const existingRooms = getAllActiveRooms();
        let roomName = "0";

        // Generate the next available room name
        while (existingRooms.includes(roomName)) {
            roomName = (parseInt(roomName) + 1).toString();
        }

        // Kontrollera om rummet är fullt
        const currentUsers = getUsersInRoom(roomName).length;
        const maxUsers = roomMaxLimits[roomName];

        if (maxUsers && currentUsers >= maxUsers) {
            console.log(`Room ${roomName} is full. User ${name} cannot join.`);
            return callback({ success: false, message: "Room is full." });
        }

        // Join the user to the generated room
        socket.join(roomName);
        activateUser(socket.id, name, roomName);

        // Notify the client of the room name
        callback({ success: true, roomName });

        // Update the room list for all clients
        io.emit("roomList", getAllActiveRooms().map((room) => ({
            name: room,
            userCount: getUsersInRoom(room).length,
            maxUsers: roomMaxLimits[room] || null, // Lägg till maxgränsen om den finns
        })));
    });

    // När en användare blir kontrollansvarig
    socket.on('youAreNowController', (username) => {
        const user = getUserBySocketId(socket.id);  // Hämtar användare baserat på socket-id
        if (user) {
            io.to(room).emit('youAreNowController', user.name);  // Skickar användarens namn till rummet
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

        io.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} has left`));
        io.to(user.room).emit('userList', {
            users: getUsersInRoom(user.room),
        });

        io.emit('roomList', {
            rooms: getAllActiveRooms(),
        });

        // Om användaren som lämnar var kontrollansvarig, ge kontrollen till en annan användare
        if (user.isController) {
            const others = getUsersInRoom(user.room).filter(u => u.id !== user.id);
            if (others.length > 0) {
                const newController = others[0];
                newController.isController = true;
                roomControllers[user.room] = newController.id; // Uppdatera kontrollansvarig

                // Skicka meddelande om att kontrollen har överförts
                io.to(user.room).emit('message', buildMsg(ADMIN, `${newController.name} is now in controll.`));

                // Skicka 'youAreNowController' till den nya kontrollansvarige
                io.to(newController.id).emit('youAreNowController');
            } else {
                // Om ingen annan är kvar i rummet, ta bort kontrollansvaret
                delete roomControllers[user.room];
            }
        }

        // Uppdatera rumslistan för alla klienter
        io.emit("roomList", getAllActiveRooms().map((room) => ({
            name: room,
            userCount: getUsersInRoom(room).length,
            maxUsers: roomMaxLimits[room] || null, // Lägg till maxgränsen om den finns
        })));

        // Uppdatera användarlistan för alla i rummet
        if (user) {
            io.to(user.room).emit('userList', {
                users: getUsersInRoom(user.room),
            });
        }

        console.log(`User ${socket.id} disconnected`);
    });

    socket.on('leaveRoom', ({ name, room }) => {
        console.log(`Received leaveRoom event: ${name} is leaving room ${room}`);

        const user = getUser(socket.id);

        if (user) {
            userLeavesApp(socket.id);
            socket.leave(room);

            io.to(room).emit('message', buildMsg(ADMIN, `${name} has left`));
            io.to(room).emit('userList', {
                users: getUsersInRoom(room),
            });

            // Om användaren som lämnar var kontrollansvarig, ge kontrollen till en annan användare
            if (user.isController) {
                const others = getUsersInRoom(room).filter(u => u.id !== user.id);
                if (others.length > 0) {
                    const newController = others[0];
                    newController.isController = true;
                    roomControllers[room] = newController.id; // Uppdatera kontrollansvarig

                    // Skicka meddelande om att kontrollen har överförts
                    io.to(room).emit('message', buildMsg(ADMIN, `${newController.name} is in controll.`));

                    // Skicka 'youAreNowController' till den nya kontrollansvarige
                    io.to(newController.id).emit('youAreNowController');
                } else {
                    // Om ingen annan är kvar i rummet, ta bort kontrollansvaret
                    delete roomControllers[room];
                }
            }

            // Uppdatera rumslistan för alla klienter
            io.emit("roomList", getAllActiveRooms().map((room) => ({
                name: room,
                userCount: getUsersInRoom(room).length,
                maxUsers: roomMaxLimits[room] || null, // Lägg till maxgränsen om den finns
            })));

            // Uppdatera användarlistan för alla i rummet
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

    socket.on("getRoomList", () => {
        const rooms = getAllActiveRooms().map((room) => ({
            name: room,
            userCount: getUsersInRoom(room).length,
            maxUsers: roomMaxLimits[room] || null, // Lägg till maxgränsen om den finns
        }));
        socket.emit("roomList", rooms); // Skicka en array direkt
    });

    socket.on('syncTime', (time) => {
        const user = getUser(socket.id);
        if (user && user.isController) { // Endast kontrollansvarig kan synkronisera tiden
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