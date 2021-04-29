import redis from 'redis';
import { promisify } from 'util';

const REDIS_URL = ''; // default localhost

const client = redis.createClient();

client.on('error', function(error) {
  console.error(error);
});

export const get = promisify(client.get).bind(client);
export const set = promisify(client.set).bind(client);
export const sadd = promisify(client.sadd).bind(client);
export const smembers = promisify(client.smembers).bind(client);
export const srem = promisify(client.srem).bind(client);


export default client;