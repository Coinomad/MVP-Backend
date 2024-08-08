const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const cryptoJs = require('crypto-js');
const axios = require('axios');
const moment = require('moment-timezone');
const { scheduledPaymentQueue } = require('./queues');

dotenv.config();

const { SERVER_URL } = process.env;

const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error("Hashing failed", error);
  }
};

const comparePasswords = async (inputPassword, hashedPassword) => {
  try {
    return await bcrypt.compare(inputPassword, hashedPassword);
  } catch (error) {
    throw new Error("Comparison failed", error);
  }
};

// Generate a random key and initialization vector (IV)
const algorithm = "aes-256-cbc";
const key = process.env.ENCRYPTION_KEY;

const encrypt = (text) => {
  const cipherText = cryptoJs.AES.encrypt(text, key).toString();
  return cipherText;
};

const decrypt = (encryptedText) => {
  try {
    const bytes = cryptoJs.AES.decrypt(encryptedText, key);
    if (bytes.sigBytes > 0) {
      const decryptedData = bytes.toString(cryptoJs.enc.Utf8);
      return decryptedData;
    } else {
      throw new Error("Decryption Failed Invalid Key");
    }
  } catch (error) {
    throw new Error("Decryption Failed Invalid Key", error);
  }
};

const getBitcoinActualBalance = async (incoming, incoming_Pending, outgoing, outgoing_Pending) => {
  const actualBalance =
    Number(incoming) +
    Number(incoming_Pending) -
    (Number(outgoing) + Number(outgoing_Pending));
  return actualBalance;
};

const convertWalletAddressToQRCode = async (walletAddress) => {
  const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${walletAddress}`;
  return qrCode;
};

// Function to create webhook subscription
const createWebhookSubscription = async (employer) => {
  try {
    // Subscribe for Bitcoin
    const btcResponse = await axios.post("/v4/subscription", {
      type: "INCOMING_NATIVE_TX",
      attr: {
        chain: "BTC", // Blockchain type
        address: employer.bitcoinWalletAddress,
        url: `${SERVER_URL}/v1/api/wallet/receive/bitcoin`, // Webhook endpoint for BTC
      },
    });

    employer.subscriptionBTCId = btcResponse.data.id;

    // Subscribe for Polygon
    const polygonResponse = await axios.post("/v4/subscription", {
      type: "INCOMING_NATIVE_TX",
      attr: {
        chain: "MATIC", // Blockchain type
        address: employer.polygonWalletAddress,
        url: `${SERVER_URL}/v1/api/wallet/receive/polygon`, // Webhook endpoint for Polygon
      },
    });

    employer.subscriptionPolygonId = polygonResponse.data.id;

    // Save the subscription IDs to the employer document
    await employer.save();

    return "Success";
  } catch (error) {
    return {
      error: { message: error.message },
    };
  }
};

const schedulePayment = async (
  employerId,
  employeeId,
  value,
  asset,
  hour = 0,
  minute = 0,
  day = 0, // default to Sunday if not provided
  date = 1 // default to the 1st of the month if not provided
) => {
  let cronExpression;
  console.log("erroror", value.frequency);

  const now = moment().tz("UTC").toISOString();
  // Create the scheduled time for today in UTC
  const scheduledTimeToday = moment()
    .tz("UTC")
    .set({
      hour,
      minute,
      second: 0,
      millisecond: 0,
    })
    .toISOString();

  console.log("timesdss", now, scheduledTimeToday);
  switch (value.frequency) {
    case "daily":
      cronExpression = `0 ${minute} ${hour} * * *`; //midnight daily
      break;
    case "weekly":
      cronExpression = `0 ${minute} ${hour} * * ${day}`; // midnight every Sunday (new week)
      break;
    case "monthly":
      cronExpression = `0 ${minute} ${hour} ${date} * *`; // every new month
      break;
    default:
      throw new Error("Invalid frequency");
  }
  console.log("cronExpression", cronExpression);

  if (now < scheduledTimeToday) {
    console.log("timesdss", now, scheduledTimeToday);
    // Schedule a job for today at the specified time
    await scheduledPaymentQueue.add(
      {
        employerId,
        employeeId,
        asset,
        value,
      },
      {
        delay: new Date(scheduledTimeToday).getTime() - new Date(now).getTime(),
        jobId: `${employerId}-${employeeId}-${value.amount}-initial-${value.frequency}`,
      }
    );
    console.log(`Scheduled initial payment for today at ${scheduledTimeToday}`);
  }

  await scheduledPaymentQueue.add(
    {
      employerId,
      employeeId,
      asset,
      value,
    },
    {
      repeat: { cron: cronExpression },
      jobId: `${employerId}-${employeeId}-${value.amount}-${value.frequency}`,
    }
  );
  console.log(
    `Scheduled payment for user ${employeeId} with frequency ${value.frequency}`
  );
};

module.exports = {
  hashPassword,
  comparePasswords,
  encrypt,
  decrypt,
  getBitcoinActualBalance,
  convertWalletAddressToQRCode,
  createWebhookSubscription,
  schedulePayment
};
