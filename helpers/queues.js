import Queue from "bull";
import IORedis from "ioredis";


const connection = new IORedis({
  host: "127.0.0.1",
  port: 6379,
});

connection.on("ready", () => {
  console.log("Redis connected successfully");
});

connection.on("error", (error) => {
  console.error("error:", error);
});

const redisConfig = {
  redis: {
    host: "127.0.0.1",
    port: 6379,
  },
};

const scheduledPaymentQueue = new Queue("scheduledPayments", redisConfig);

export { scheduledPaymentQueue };
