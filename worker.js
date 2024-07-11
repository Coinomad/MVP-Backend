// const Queue = require('bull');

import { sendBitcoinToEmployee } from "./controllers/walletControllers/bitcoinControllers.js";
import { sendPolygonToEmployee } from "./controllers/walletControllers/polygonControllers.js";
import { scheduledPaymentQueue } from "./helpers/queues.js";

// Function to process a scheduled payment
async function processScheduledPayment(job) {
  const { employer, employee, value, asset } = job.data;
  // Simulate request and response objects
  const req = {
    employer: employer,
    employee: employee,
    value: value,
  };
  const res = {
    status: (statusCode) => ({
      json: (data) => console.log(`Response: ${JSON.stringify(data)}`),
    }),
  };

  // Call the sendBitcoinToEmployee function
  if (asset === "bitcoin") {
    await sendBitcoinToEmployee(req, res);
  } else {
    await sendPolygonToEmployee(req, res);
  }
}

// Add the processor to the queue
scheduledPaymentQueue.process(processScheduledPayment);

console.log("Worker is running and waiting for jobs...");
