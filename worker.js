const {
  sendBitcoinToEmployee,
} = require("./controllers/walletControllers/bitcoinControllers");
const {
  sendPolygonToEmployee,
} = require("./controllers/walletControllers/polygonControllers");
const { scheduledPaymentQueue } = require("./helpers/queues");

// Function to process a scheduled payment
const processScheduledPayment = async (job) => {
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
};

// Add the processor to the queue
scheduledPaymentQueue.process(processScheduledPayment);

console.log("Worker is running and waiting for jobs...");
