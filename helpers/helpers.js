import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import cryptoJs from "crypto-js";
import axios from "axios";
import { scheduledPaymentQueue } from "./queues.js";

dotenv.config();

const { SERVER_URL } = process.env;

export const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error("Hashing failed", error);
  }
};

export const comparePasswords = async (inputPassword, hashedPassword) => {
  try {
    return await bcrypt.compare(inputPassword, hashedPassword);
  } catch (error) {
    throw new Error("Comparison failed", error);
  }
};

// Generate a random key and initialization vector (IV)
const algorithm = "aes-256-cbc";
const key = process.env.ENCRYPTION_KEY;

export const encrypt = (text) => {
  const cipherText = cryptoJs.AES.encrypt(text, key).toString();

  return cipherText;
};

export const decrypt = (encryptedText) => {
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

export const getBitcoinActualBalance = async (
  incoming,
  incoming_Pending,
  outgoing,
  outgoing_Pending
) => {
  const actualBalance =
    Number(incoming) +
    Number(incoming_Pending) -
    (Number(outgoing) + Number(outgoing_Pending));
  return actualBalance;
};

export const convertWalletAddressToQRCode = async (walletAddress) => {
  const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${walletAddress}`;
  return qrCode;
};

// Function to create webhook subscription
export const createWebhookSubscription = async (employer) => {
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
      error: { message: error },
    };
  }
};

export const schedulePayment = async (
  employerId,
  employeeId,
  value,
  asset,
  scheduledTransactionId
) => {
  // employer._id, employee._id, value, asset,scheduledTransaction._id
  let cronExpression;

  switch (value.frequency) {
    case "daily":
      cronExpression = "0 0 * * *"; //midnight daily
      break;
    case "weekely":
      cronExpression = "0 0 * * 0"; // midnight every sunday(new week)
      break;
    case "monthly":
      cronExpression = "0 0 1 * *"; //every new month
    default:
      throw new Error("Invalid frequency");
  }

  await scheduledPaymentQueue.add(
    {
      employerId,
      employeeId,
      asset,
      scheduledTransactionId,
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
