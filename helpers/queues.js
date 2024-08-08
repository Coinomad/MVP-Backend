import Queue from "bull";
import IORedis from "ioredis";

// const redisUrl="rediss://red-cqb2o86ehbks73dhlab0:qgGYvGrq0RYkLDMNFzLJ69BNE0qXasOW@oregon-redis.render.com:6379"

const redisUrl = "rediss://red-cpovkhij1k6c73b345fg:VmQkTxvsIz1pNWIITbW4FiqI7GeFoNpQ@frankfurt-redis.render.com:6379";

const connection = new  IORedis(redisUrl);

// const connection = new IORedis({
//   host: "redis://red-cpovkhij1k6c73b345fg",
//   port: 6379,
// });

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

const scheduledPaymentQueue = new Queue("scheduledPayments", connection);

export { scheduledPaymentQueue };
