import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import cryptoJs from "crypto-js";

dotenv.config();
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
 const actualBalance =(incoming+incoming_Pending)-(outgoing+outgoing_Pending);
  return actualBalance;
};



export const convertWalletAddressToQRCode = async (walletAddress) => {
  const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${walletAddress}`;
  return qrCode;
}