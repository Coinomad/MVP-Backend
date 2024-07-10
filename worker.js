// const Queue = require('bull');
import { scheduledPaymentQueue } from "./helpers/queues.js";

import { sendBitcoinToEmployee } from "./controllers/walletControllers/bitcoinControllers.js";
// Function to process a scheduled payment
async function processScheduledPayment(job) {
  const { userId, value } = job.data;
  // Simulate request and response objects
  const req = {
    user: { id: userId },
    body: value,
  };
  const res = {
    status: (statusCode) => ({
      json: (data) => console.log(`Response: ${JSON.stringify(data)}`),
    }),
  };

  // Call the sendBitcoinToEmployee function
  await sendBitcoinToEmployee(req, res);
}

// Add the processor to the queue
scheduledPaymentQueue.process(processScheduledPayment);

console.log('Worker is running and waiting for jobs...');
