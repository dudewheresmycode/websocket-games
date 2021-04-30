import * as redis from '../services/redis';

function serialize(user) {
  return JSON.stringify(user);
}

function deserialize(str) {
  return JSON.parse(str);
}

export async function userUpdate(roomId, userid, newUser) {
  const members = await userList(roomId);
  const existing = members.find(({ id }) => id === userid);
  if (existing) {
    await redis.srem(redis.KEYS.MEMBERS(roomId), serialize(existing));
  }
  const ret = await redis.sadd(redis.KEYS.MEMBERS(roomId), serialize(newUser));
  return userList(roomId);
}

export async function userLeave(roomId, socketId) {
  const members = await userList(roomId);
  const existing = members.find(({ socket }) => socket === socketId);
  if (existing) {
    await redis.srem(redis.KEYS.MEMBERS(roomId), serialize(existing));
  }  
  return userList(roomId);
}

export async function userList(roomId) {
  let members = await redis.smembers(redis.KEYS.MEMBERS(roomId));
  console.log('[members]', members);
  if (!members) {
    return [];
  }
  members = members.map(deserialize);
  // const socketOpen = !!io.sockets.sockets.get('UUglpSpbISSv_VjhAAAB');
  // console.log('socketOpen', socketOpen);
  for (const member of members) {
    if (!io.sockets.sockets.get(member.socket)) {
      console.log('socketClosed');
      await redis.srem(redis.KEYS.MEMBERS(roomId), serialize(member));
    } else {
      console.log('socketOpen');
    }
  }
  return members;
}
