// import { userLeave, userList, userUpdate } from './members';
import * as redis from '../services/redis';
import * as balderdash from './games/balderdash';

function serialize(data) {
  return JSON.stringify(data);
}

function deserialize(str) {
  return JSON.parse(str);
}

export default class GameRooms {
  constructor(io) {
    this.io = io;
    this.connection = this.connection.bind(this);
  }

  connection(socket) {

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
    socket.join(roomId);
    console.log(`[${username}] joined room [${roomId}]`);
    
    const user = {
      id: userid,
      joinedAt: Date.now(),
      animal,
      username: username,
      socket: socket.id
    };
    
    this.initUser(roomId, socket.id, user);

    socket.on('disconnect', async () => {
      // console.log(`[disconnect] (room:${roomId}, username:${username}, userid:${userid})`);
      const members = await this.userLeave(roomId, socket.id);
      this.io.to(roomId).emit('room.members', members);
    });

    socket.on('game.start', async () => {
      const members = await this.userList(roomId);
      console.log('start with', members);
      const _gameState = await balderdash.init(roomId, members);
      this.io.to(roomId).emit('game.state', _gameState);
    });

    socket.on('game.next', async () => {
      const members = await this.userList(roomId);
      console.log('start with', members);
      const _gameState = await balderdash.turn(roomId, members);
      this.io.to(roomId).emit('game.state', _gameState);
    });

    socket.on('game.choose', async (choice) => {
      const _gameState = await balderdash.choose(roomId, userid, choice);
      this.io.to(roomId).emit('game.state', _gameState);
    });
    socket.on('game.answer', async (answer) => {
      // const members = await this.userList(roomId);
      // console.log('start with', members);
      const _gameState = await balderdash.answer(roomId, userid, answer);
      this.io.to(roomId).emit('game.state', _gameState);
    });

    socket.on('game.new_word', async () => {
      const _gameState = await balderdash.generateWord(roomId);
      this.io.to(roomId).emit('game.state', _gameState);
    });

    socket.on('setting.username', async (newUsername) => {
      const members = await this.userUpdate(roomId, socket.id, {
        ...user,
        username: newUsername
      });
      this.io.to(roomId).emit('room.members', members);
    });
    
  }

  async initUser(roomId, socketId, user) {
    // Push current member list and game state
    const members = await this.userUpdate(roomId, socketId, user);
    this.io.to(roomId).emit('room.members', members);

    const gameState = await balderdash.getState(roomId);
    this.io.to(roomId).emit('game.state', gameState);
  }

  async userUpdate(roomId, socketId, newUser) {
    const members = await this.userList(roomId);
    // const existing = members.find(({ id }) => id === userid);
    const existing = members.find(({ socket }) => socket === socketId);

    if (existing) {
      await redis.srem(redis.KEYS.MEMBERS(roomId), serialize(existing));
    }
    const ret = await redis.sadd(redis.KEYS.MEMBERS(roomId), serialize(newUser));
    return this.userList(roomId);
  }
  
  async userLeave(roomId, socketId) {
    const members = await this.userList(roomId);
    const existing = members.find(({ socket }) => socket === socketId);
    if (existing) {
      await redis.srem(redis.KEYS.MEMBERS(roomId), serialize(existing));
    }  
    return this.userList(roomId);
  }
  
  async userList(roomId) {
    let members = await redis.smembers(redis.KEYS.MEMBERS(roomId));
    // console.log('[members]', members);
    if (!members) {
      return [];
    }
    members = members.map(deserialize);
    // clear stale sockets
    for (const member of members) {
      if (!this.io.sockets.sockets.get(member.socket)) {
        await redis.srem(redis.KEYS.MEMBERS(roomId), serialize(member));
      }
    }
    return members.sort((a, b) => a.joinedAt > b.joinedAt ? 1 : -1);
  }

}

