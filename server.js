/*-Nodemon-*/
// npm install nodemon --save-dev -> instalar nodemon
// nodemon "archivo.js" -> ejecuta el programa con nodemon
// rs -> reinicia el server
// Se recomienda que nodemon se use en la etapa de desarrollo y no en pruduccion

// Variavles de Express y Socket
const express = require('express');
const path = require('path'); 
const http = require('http');
const PORT = process.env.PORT || 3000;
const socket = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socket(server);

app.use(express.static('public'));

server.listen(PORT, () => console.log("El servidor esta corriendo"));

const connections = [null, null];

// Asigna indices a nuevos jugadores
io.on('connection', socket => {
    let playerIndex = -1;
    for (const i in connections) {
        if (connections[i] === null) {
            playerIndex = i;
            break;
        }
    }

    // Indidicar si los jugadores estan conectados o no
    socket.emit("player-number", playerIndex);

    // Conectado
    console.log(`Jugador ${playerIndex} se ha conectado`);

    if (playerIndex === -1) return;
    connections[playerIndex] = false;

    socket.broadcast.emit('player-connection', playerIndex);

    // Desconectado
    socket.on('disconnect', () => {
        console.log(`Jugador ${playerIndex} se ha desconectado`);
        connections[playerIndex] = null;
        socket.broadcast.emit('player-connection', playerIndex);
    });

    // Jugador disponible o listo para jugar
    socket.on('player-ready', () => {
        socket.broadcast.emit('enemy-ready', playerIndex);
        connections[playerIndex] = true;
    });

    // Verificar la conexion de los jugadores
    socket.on('check-players', () => {
        const players = [];
        for (const i in connections) {
            connections[i] === null ? 
                players.push({connected: false, ready: false}) : //desconectado
                players.push({connected: true, ready: connections[i]}); // conectado
        }
        socket.emit('check-players', players); // Emite el estado
    });

    // Emite los disparos de los jugadores
    socket.on('fire', id => {
        console.log(`Disparo de ${playerIndex}`, id);
        socket.broadcast.emit('fire', id);
    });

    // Registra el evento del disparo
    socket.on('fire-reply', square =>{
        console.log(square);
        socket.broadcast.emit('fire-reply', square);
    });

    // Desconecta a jugadores innactivos (AFK)
    setTimeout(() => {
        connections[playerIndex] = null;
        socket.emit('timeout');
        socket.disconnect();
    }, 600000);

});