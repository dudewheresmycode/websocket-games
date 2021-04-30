import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import GameRooms from './socket';

const HTTP_PORT = process.env.PORT || 8081;
const STATIC_BUILD = `${process.cwd()}/client/build`;

const app = express();

app.use(cors());

// Create Socket.io
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*', // TODO change to proper origin for production
    methods: ['GET', 'POST']
  }
});

const rooms = new GameRooms(io);
io.on('connection', rooms.connection);

// Middleware
app.use(express.static(STATIC_BUILD));
app.get('*', (req, res) => {
  res.sendFile(`${STATIC_BUILD}/index.html`);
});

server.listen(HTTP_PORT, () => {
  console.log(`Server running at: ${HTTP_PORT}`);
});
