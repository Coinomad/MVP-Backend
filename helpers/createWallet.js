import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

axios.defaults.baseURL = "https://api.tatum.io/v3/bitcoin";
axios.defaults.headers = {
  accept: "application/json",
  "x-api-key": process.env.APIKEY,
};

export const generateWallet = async (req, res) => {
  try {
    const walletResponse = await axios.get("/wallet");
    const xpub = walletResponse.data.xpub;
    const mnemonic = walletResponse.data.mnemonic;

    const addressResponse = await axios.get(`/address/${xpub}/0`);
    const walletAddress = addressResponse.data.address;

    const privateKeyResponse = await axios.post(`/wallet/priv`, {
      index: 0,
      mnemonic,
    });
    const privateKey = privateKeyResponse.data.key;

    return {
      privateKey,
      walletAddress,
    };
  } catch (error) {
    return {
      error: { message: error },
    };
  }
};



export const getWalletBalance = async (address) => {
  try {
    const walletResponse = await axios.get(`/address/balance/${address}`);
    return walletResponse.data
  } catch (error) {
    return {
      error: { message: error },
    };
  }
};