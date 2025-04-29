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

//Anävndare i rum
let roomUsers = {}; // Objekt där nyckeln är rumsnamnet och värdet är en lista med användarnamn


// Rumstaggar
const roomTags = {}; // Key: room, Value: array of tag strings

io.on('connection', socket => {
    console.log(`User ${socket.id} connected`);

    // Skapa rum (används av React-klienten)
    socket.on("requestRoom", ({ name, maxUsers, password, tags }, callback) => {
        const existingRooms = getAllActiveRooms();
        let roomName = "0";
        while (existingRooms.includes(roomName)) {
            roomName = (parseInt(roomName) + 1).toString();
        }

        if (maxUsers) roomMaxLimits[roomName] = maxUsers;

        // Spara bara lösenord om det finns, annars ta bort gammalt
        if (typeof password === "string" && password.length > 0) {
            roomPasswords[roomName] = password;
        } else {
            delete roomPasswords[roomName];
        }

        if (tags && Array.isArray(tags)) {
            roomTags[roomName] = tags;
        } else {
            roomTags[roomName] = [];
        }

        callback({ success: true, roomName });

        io.emit("roomList", getAllActiveRooms().map((room) => ({
            name: room,
            userCount: getUsersInRoom(room).length,
            maxUsers: roomMaxLimits[room] || null,
            hasPassword: !!roomPasswords[room],
            tags: roomTags[room] || [],
        })));
    });


    // Användaren ansluter till ett rum
    socket.on('enterRoom', ({ name, room, password }, callback = () => { }) => {
        // Räkna aktiva användare i vår egen UsersState
        const currentUsers = UsersState.users.filter(u => u.room === room).length;
        const maxUsers = roomMaxLimits[room];

        if (maxUsers && currentUsers >= maxUsers) {
            return callback({ success: false, message: "Room is full." });
        }

        if (roomPasswords[room] && roomPasswords[room] !== password) {
            return callback({ success: false, message: "Incorrect password." });
        }

        // Hitta eller skapa användaren
        let user = UsersState.users.find(u => u.name === name && u.room === room);

        if (!user) {
            // Om användaren inte finns, skapa en ny användare
            user = activateUser(socket.id, name, room);
        }

        // Om användaren redan finns, anslut användaren på nytt
        socket.join(user.room);

        // Kontrollansvarig hantering
        const controllerId = roomControllers[user.room];
        if (!controllerId) {
            roomControllers[user.room] = socket.id;
            user.isController = true;
            socket.emit('youAreNowController', user.name);
        } else if (controllerId === socket.id) {
            user.isController = true;
            socket.emit('youAreNowController', user.name);
        } else {
            user.isController = false;
        }

        // Skicka video state direkt till den nya användaren
        const userState = getUser(socket.id);
        if (userState) {
            socket.emit('initialState', {
                currentTime: userState.videoTime || 0,
                isPlaying: userState.isPlaying || false,
                isController: userState.isController || false
            });
        }

        socket.emit('getInitialState');

        // Skicka användarlistan direkt till den nya användaren
        const usersInRoom = getUsersInRoom(user.room);
        socket.emit('userList', { users: usersInRoom });  // Skicka användarlistan till den nya användaren

        // Uppdatera användarlistan för alla anslutna användare
        io.to(user.room).emit('userList', { users: getUsersInRoom(user.room) });

        // Skicka rumslista till alla användare
        io.emit("roomList", getAllActiveRooms().map((room) => ({
            name: room,
            userCount: getUsersInRoom(room).length,
            maxUsers: roomMaxLimits[room] || null,
            hasPassword: !!roomPasswords[room],
            tags: roomTags[room] || []
        })));

        io.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} has joined`));

        return callback({
            success: true,
            message: "Joined the room successfully.",
            users: usersInRoom
        });
    });

    // Sätt maxgräns för rum
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

    // Hämta rumslista
    socket.on("getRoomList", () => {
        const rooms = getAllActiveRooms().map((room) => ({
            name: room,
            userCount: getUsersInRoom(room).length,
            maxUsers: roomMaxLimits[room] || null,
            hasPassword: !!roomPasswords[room],
            tags: roomTags[room] || [] //Taggar tillr ummet

        }));
        socket.emit("roomList", rooms);
    });

    // Lämna rum
    socket.on('leaveRoom', ({ name, room }) => {
        const user = getUser(socket.id);
        if (user) {
            userLeavesApp(socket.id);
            socket.leave(room);

            io.to(room).emit('message', buildMsg(ADMIN, `${name} has left`));
            io.to(room).emit('userList', { users: getUsersInRoom(room) });

            // Kontrollansvarig-hantering
            if (user.isController) {
                const others = getUsersInRoom(room).filter(u => u.id !== user.id);
                if (others.length > 0) {
                    const newController = others[0];
                    newController.isController = true;
                    roomControllers[room] = newController.id;
                    io.to(room).emit('message', buildMsg(ADMIN, `${newController.name} is in control.`));
                    io.to(newController.id).emit('youAreNowController', newController.name);
                } else {
                    delete roomControllers[room];
                }
            }

            // Rensa lösenord och maxUsers om rummet är tomt
            if (getUsersInRoom(room).length === 0) {
                delete roomPasswords[room];
                delete roomMaxLimits[room];
            }

            io.emit("roomList", getAllActiveRooms().map((room) => ({
                name: room,
                userCount: getUsersInRoom(room).length,
                maxUsers: roomMaxLimits[room] || null,
                hasPassword: !!roomPasswords[room],
                tags: roomTags[room] || []
            })));

            io.to(room).emit('userList', { users: getUsersInRoom(room) });
        }
    });

    // Koppla bort användare
    socket.on('disconnect', () => {
        const user = getUser(socket.id);
        if (!user) return;

        userLeavesApp(socket.id);

        io.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} has left`));
        io.to(user.room).emit('userList', { users: getUsersInRoom(user.room) });

        // Kontrollansvarig-hantering
        if (user.isController) {
            const others = getUsersInRoom(user.room).filter(u => u.id !== user.id);
            if (others.length > 0) {
                const newController = others[0];
                newController.isController = true;
                roomControllers[user.room] = newController.id;
                io.to(user.room).emit('message', buildMsg(ADMIN, `${newController.name} is now in control.`));
                io.to(newController.id).emit('youAreNowController', newController.name);
            } else {
                delete roomControllers[user.room];
            }
        }

        io.emit("roomList", getAllActiveRooms().map((room) => ({
            name: room,
            userCount: getUsersInRoom(room).length,
            maxUsers: roomMaxLimits[room] || null,
            hasPassword: !!roomPasswords[room],
            tags: roomTags[room] || []
        })));

        io.to(user.room).emit('userList', { users: getUsersInRoom(user.room) });
        console.log(`User ${socket.id} disconnected`);
    });

    // Meddelandehantering
    socket.on('message', ({ name, text }) => {
        const room = getUser(socket.id)?.room;
        if (room) {
            io.to(room).emit('message', buildMsg(name, text));
        }
    });

    // Aktivitetshantering
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

    socket.on('getInitialState', () => {
        const userState = getUser(socket.id);
        if (userState) {
            socket.emit('initialState', {
                currentTime: userState.videoTime || 0,
                isPlaying: userState.isPlaying || false,
                isController: userState.isController || false
            });
        }
    });

});

export { io, app, server };