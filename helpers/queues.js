import Queue from "bull";

const redisConfig = {
    redis: {
        host: 'redis-stack-server.orb.local',
        port: 6379
    }
} 

const scheduledPaymentQueue = new Queue('scheduledPayments', redisConfig);

export { scheduledPaymentQueue };