const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words'); // https://www.npmjs.com/package/bad-words
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

// .env variables
const { port } = require('./../config');

// Create app
const app = express();
const server = http.createServer(app);
// Create sockets
const io = socketio(server);

// Serve public folder
const publicDirectoryPath = path.join(__dirname, '../public');
app.use(express.static(publicDirectoryPath));


io.on('connection', (socket) => {
    console.log('New WebSocket connection.');

    socket.on('join', ({ username, room }, callback) => {

        const { error, user } = addUser({ id: socket.id, username, room });

        if (error) {
            return callback(error);
        }

        socket.join(user.room);

        socket.emit('message', generateMessage('Admin', 'Welcome!'));
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        });

        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        const filter = new Filter();

        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed!');
        }

        io.to(user.room).emit('message', generateMessage(user.username, message));
        callback();
    });

    socket.on('sendLocation', (userLocation, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://www.google.com/maps?q=${userLocation.latitude},${userLocation.longitude}`));
        callback();
        // https://www.google.com/maps?q=latitude,longitude
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            });
        }
    });
});

// Fire server
server.listen(port, () => {
    console.log(`App is running on port ${port}.`);
});