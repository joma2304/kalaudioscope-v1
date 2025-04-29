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

// Room state
const roomControllers = {};   // room: socketId
const roomMaxLimits = {};     // room: number
const roomPasswords = {};     // room: string
const roomTags = {};          // room: string[]
const roomCleanupTimers = {}; // roomName -> timeout

const emitRoomList = () => {
    io.emit("roomList", getAllActiveRooms().map((room) => ({
        name: room,
        userCount: getUsersInRoom(room).length,
        maxUsers: roomMaxLimits[room] || null,
        hasPassword: !!roomPasswords[room],
        tags: roomTags[room] || []
    })));
};

io.on("connection", socket => {
    console.log(`User ${socket.id} connected`);

    socket.on("requestRoom", ({ name, maxUsers, password, tags }, callback) => {
        const existingRooms = getAllActiveRooms();
        let roomName = "0";
        while (existingRooms.includes(roomName)) roomName = (parseInt(roomName) + 1).toString();

        if (maxUsers) roomMaxLimits[roomName] = maxUsers;
        password ? roomPasswords[roomName] = password : delete roomPasswords[roomName];
        roomTags[roomName] = Array.isArray(tags) ? tags : [];

        callback({ success: true, roomName });
        emitRoomList();
    });

    socket.on("enterRoom", ({ name, room, password }, callback = () => { }) => {

        // Återställ ev. borttagnings-timer om rummet används igen
        if (roomCleanupTimers[room]) {
            clearTimeout(roomCleanupTimers[room]);
            delete roomCleanupTimers[room];
        }

        const currentUsers = getUsersInRoom(room).length;

        if (roomMaxLimits[room] && currentUsers >= roomMaxLimits[room])
            return callback({ success: false, message: "Room is full." });

        if (roomPasswords[room] && roomPasswords[room] !== password)
            return callback({ success: false, message: "Incorrect password." });

        let user = UsersState.users.find(u => u.name === name && u.room === room);
        const isNewUser = !user;

        if (!user) user = activateUser(socket.id, name, room);
        else user.id = socket.id; // uppdatera socket.id om användaren återansluter

        socket.join(user.room);

        // Kontrollerhantering
        const controllerId = roomControllers[user.room];
        if (!controllerId || controllerId === socket.id) {
            roomControllers[user.room] = socket.id;
            user.isController = true;
            socket.emit("youAreNowController", user.name);
        } else {
            user.isController = false;
        }

        const userState = getUser(socket.id);
        if (userState) {
            socket.emit("initialState", {
                currentTime: userState.videoTime || 0,
                isPlaying: userState.isPlaying || false,
                isController: userState.isController || false
            });
        }

        socket.emit("getInitialState");
        socket.emit("userList", { users: getUsersInRoom(user.room) });
        io.to(user.room).emit("userList", { users: getUsersInRoom(user.room) });
        emitRoomList();

        socket.emit("message", buildMsg(ADMIN, "Welcome to the chat!"));

        if (isNewUser) {
            socket.broadcast.to(user.room).emit("message", buildMsg(ADMIN, `${user.name} has joined`));
        }

        return callback({ success: true, message: "Joined the room successfully.", users: getUsersInRoom(user.room) });
    });


    socket.on("setRoomLimit", ({ room, maxUsers }, callback) => {
        const user = getUser(socket.id);
        if (!user || user.room !== room || maxUsers <= 0)
            return callback({ success: false, message: "Invalid request." });

        roomMaxLimits[room] = maxUsers;
        callback({ success: true, message: `Max user limit set to ${maxUsers} for room ${room}.` });
    });

    socket.on("getRoomList", () => socket.emit("roomList", getAllActiveRooms().map(room => ({
        name: room,
        userCount: getUsersInRoom(room).length,
        maxUsers: roomMaxLimits[room] || null,
        hasPassword: !!roomPasswords[room],
        tags: roomTags[room] || []
    }))));

    // När användaren lämnar rummet
    const handleUserLeave = (socketId, customMessage = null) => {
        const user = getUser(socketId);
        if (!user) return;

        userLeavesApp(socketId);
        const room = user.room;
        socket.leave(room);

        io.to(room).emit("message", buildMsg(ADMIN, customMessage || `${user.name} has left`));
        io.to(room).emit("userList", { users: getUsersInRoom(room) });

        // Kontrollansvarig omfördelas
        if (user.isController) {
            const others = getUsersInRoom(room).filter(u => u.id !== user.id);
            if (others.length > 0) {
                const newController = others[0];
                newController.isController = true;
                roomControllers[room] = newController.id;
                io.to(room).emit("message", buildMsg(ADMIN, `${newController.name} is in control.`));
                io.to(newController.id).emit("youAreNowController", newController.name);
            } else {
                delete roomControllers[room];
            }
        }

        const remainingUsers = getUsersInRoom(room);
        if (remainingUsers.length === 0) {
            // Starta timer för att ta bort rummet efter 2 minuter
            if (!roomCleanupTimers[room]) {
                roomCleanupTimers[room] = setTimeout(() => {
                    delete roomPasswords[room];
                    delete roomMaxLimits[room];
                    delete roomControllers[room];
                    delete roomTags[room];
                    delete roomCleanupTimers[room];
                    emitRoomList();
                    console.log(`Room ${room} was removed after being empty for 2 minutes.`);
                }, 2 * 60 * 1000); // 2 minuter
            }
        } else {
            // Om någon är kvar i rummet – avbryt eventuell timer
            if (roomCleanupTimers[room]) {
                clearTimeout(roomCleanupTimers[room]);
                delete roomCleanupTimers[room];
            }
        }

        emitRoomList();
    };


    socket.on("leaveRoom", ({ name, room }) => handleUserLeave(socket.id));

    socket.on("disconnect", () => {
        handleUserLeave(socket.id);
        console.log(`User ${socket.id} disconnected`);
    });

    socket.on("message", ({ name, text }) => {
        const room = getUser(socket.id)?.room;
        if (room) io.to(room).emit("message", buildMsg(name, text));
    });

    socket.on("activity", (name) => {
        const room = getUser(socket.id)?.room;
        if (room) socket.broadcast.to(room).emit("activity", name);
    });

    socket.on("syncTime", (time) => {
        const user = getUser(socket.id);
        if (user?.isController) {
            user.videoTime = time;
            socket.broadcast.to(user.room).emit("syncTime", time);
        }
    });

    socket.on("togglePlayPause", (isPlaying) => {
        const user = getUser(socket.id);
        if (user?.isController) {
            user.isPlaying = isPlaying;
            socket.broadcast.to(user.room).emit("togglePlayPause", isPlaying);
        }
    });
});

export { io, app, server };