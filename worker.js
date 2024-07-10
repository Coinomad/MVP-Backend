// const Queue = require('bull');

import { scheduleBitcoinEmployeeTranscation } from "./controllers/walletControllers/bitcoinControllers.js";
import { scheduledPaymentQueue } from "./helpers/queues.js";



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
  await scheduleBitcoinEmployeeTranscation(req, res);
}

// Add the processor to the queue
scheduledPaymentQueue.process(processScheduledPayment);

console.log('Worker is running and waiting for jobs...');
