import Queue from "bull";

const redisConfig = {
    redis: {
        host: '127.0.0.1',
        port: 6379
    }
} 

const scheduledPaymentQueue = new Queue('scheduledPayments', redisConfig);

export { scheduledPaymentQueue };