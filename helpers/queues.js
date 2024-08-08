const Queue = require('bull');
const IORedis = require('ioredis');

// Replace with your Redis URL
const redisUrl = "rediss://red-cpovkhij1k6c73b345fg:VmQkTxvsIz1pNWIITbW4FiqI7GeFoNpQ@frankfurt-redis.render.com:6379";

// Create a new Redis connection using IORedis
const connection = new IORedis(redisUrl);

// Event listeners for Redis connection
connection.on('ready', () => {
  console.log('Redis connected successfully');
});

connection.on('error', (error) => {
  console.error('Redis error:', error);
});

// Queue configuration
const scheduledPaymentQueue = new Queue('scheduledPayments', {
  redis: connection,
});

module.exports = { scheduledPaymentQueue };
