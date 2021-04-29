import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import * as redis from './services/redis';
import * as balderdash from './games/balderdash';

const HTTP_PORT = process.env.PORT || 8081;
const STATIC_BUILD = `${process.cwd()}/client/build`;

const app = express();

app.use(cors());

// Create Socket.io
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*', // TODO change to proper origin for PRODUCTION
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(express.static(STATIC_BUILD));
app.get((req, res) => {
  res.sendFile(`${STATIC_BUILD}/index.html`);
});


function serializeUser(user) {
  return JSON.stringify(user);
}
function deserializeUser(str) {
  return JSON.parse(str);
}

const KEYS = {
  MEMBERS: (roomId) => `members:${roomId}`
};

const members = new Set();

async function userUpdate(roomId, userid, newUser) {
  const members = await userList(roomId);
  const existing = members.find(({ id }) => id === userid);
  if (existing) {
    await redis.srem(KEYS.MEMBERS(roomId), serializeUser(existing));
  }
  const ret = await redis.sadd(KEYS.MEMBERS(roomId), serializeUser(newUser));
  return userList(roomId);
}

async function userLeave(roomId, socketId) {
  const members = await userList(roomId);
  const existing = members.find(({ socket }) => socket === socketId);
  if (existing) {
    await redis.srem(KEYS.MEMBERS(roomId), serializeUser(existing));
  }  
  return userList(roomId);
}

async function userList(roomId) {
  let members = await redis.smembers(KEYS.MEMBERS(roomId));
  console.log('[members]', members);
  if (!members) {
    return [];
  }
  members = members.map(deserializeUser);
  // const socketOpen = !!io.sockets.sockets.get('UUglpSpbISSv_VjhAAAB');
  // console.log('socketOpen', socketOpen);
  for (const member of members) {
    if (!io.sockets.sockets.get(member.socket)) {
      console.log('socketClosed');
      await redis.srem(KEYS.MEMBERS(roomId), serializeUser(member));
    } else {
      console.log('socketOpen');
    }
  }
  return members;
}


io.on('connection', async (socket) => {
  const {
    animal,
    roomId,
    username,
    userid
  } = socket.handshake.query;
  if (!roomId) {
    throw new Error('Missing roomId in socket connection');
  }
  if (!username) {
    throw new Error('Missing username in socket connection');
  }
  console.log(`[connect] (room:${roomId}, user:${username})`, animal);
  socket.join(roomId);
  const user = {
    id: userid,
    animal,
    username: username,
    socket: socket.id
  };
  
  
  const members = await userUpdate(roomId, userid, user);
  
  io.to(roomId).emit('room.members', members);
  
  const gameState = await balderdash.getState(roomId);
  io.to(roomId).emit('game.state', gameState);

  socket.on('disconnect', async () => {
    console.log(`[disconnect] (room:${roomId}, username:${username}, userid:${userid})`);
    const members = await userLeave(roomId, socket.id);
    io.to(roomId).emit('room.members', members);
  });
  socket.on('game.start', async () => {
    const members = await userList();
    const _gameState = await balderdash.init(roomId, members);
    io.to(roomId).emit('game.state', _gameState);
  });
  socket.on('game.new_word', async () => {
    const _gameState = await balderdash.generateWord(roomId);
    io.to(roomId).emit('game.state', _gameState);
  });
  socket.on('setting.username', async (newUsername) => {
    const members = await userUpdate(roomId, userid, {
      ...user,
      username: newUsername
    });
    io.to(roomId).emit('room.members', members);
  });
});

server.listen(HTTP_PORT, () => {
  console.log(`Server running at: ${HTTP_PORT}`);
});
