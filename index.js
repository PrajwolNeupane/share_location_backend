import express from "express";
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

const port = 5000;
const app = express();
app.use(
    cors({
        origin: [
            "https://sharelocationdemo.netlify.app/"
        ],
        credentials: true,
    })
);
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "Working Fine"
    });
});

const server = createServer(app);

// Create Socket.io server
const io = new Server(server, {
    cors: {
        origin: [
            "https://sharelocationdemo.netlify.app/"
        ],
        methods: ["GET", "POST"],
        credentials: true
    }
});

let activeUsers = [];

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // When a user shares their location
    socket.on('share', (location) => {
        const userIndex = activeUsers.findIndex(user => user.socketId === socket.id);

        if (userIndex === -1) {
            activeUsers.push({ socketId: socket.id, lat: location.lat, lon: location.lon });
        } else {
            activeUsers[userIndex].lat = location.lat;
            activeUsers[userIndex].lon = location.lon;
        }

        // Emit the location of the new user to all other users
        socket.broadcast.emit('receive-share', {
            socketId: socket.id,
            lat: location.lat,
            lon: location.lon
        });

        // Emit the locations of all other users to the new user
        activeUsers.forEach(activeUser => {
            if (activeUser.socketId !== socket.id) {
                socket.emit('receive-share', {
                    socketId: activeUser.socketId,
                    lat: activeUser.lat,
                    lon: activeUser.lon
                });
            }
        });
    });

    // Handle user disconnection
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        activeUsers = activeUsers.filter(user => user.socketId !== socket.id);
    });
});

server.listen(port, () => {
    console.log("---------------------------");
    console.log(`Server is listening at ${port}`);
});

export default server;
