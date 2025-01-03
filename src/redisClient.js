import Redis from 'ioredis';

const redisClient = new Redis({
  host: '10.0.0.4',
  port: 6379,
  maxRetriesPerRequest: 3,
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
  console.log('Redis connection error:', err.message); // Display the error message
});

redisClient.on('close', () => {
  console.log('Redis connection closed');
});

export default redisClient;
