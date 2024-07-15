// const Queue = require('bull');

import { sendBitcoinToEmployee } from "./controllers/walletControllers/bitcoinControllers.js";
import { sendPolygonToEmployee } from "./controllers/walletControllers/polygonControllers.js";
import { scheduledPaymentQueue } from "./helpers/queues.js";

// Function to process a scheduled payment
async function processScheduledPayment(job) {
  const { employerId, employeeId, asset, scheduledTransactionId, value } =
    job.data;
  // Simulate request and response objects
  const req = { employerId, employeeId, asset, scheduledTransactionId, value };
  const res = {
    status: (statusCode) => ({
      json: (data) => console.log(`Response: ${JSON.stringify(data)}`),
    }),
  };
  try {
    // Call the sendBitcoinToEmployee function
    if (asset === "bitcoin") {
      await sendBitcoinToEmployee(req, res);
    } else if (asset === "polygon") {
      await sendPolygonToEmployee(req, res);
    } else {
      throw new Error("Unsupported asset");
    }
  } catch (error) {
    console.error(`Failed to process payment: ${error.message}`);
    throw error;
  }
}

// Add the processor to the queue
scheduledPaymentQueue.process(processScheduledPayment);

console.log("Worker is running and waiting for jobs...");
