import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

axios.defaults.baseURL = "https://api.tatum.io";
axios.defaults.headers = {
  accept: "application/json",
  "x-api-key": process.env.APIKEY,
};

export const generateBTCWallet = async () => {
  try {
    const walletResponse = await axios.get("/v3/bitcoin/wallet");
    const xpub = walletResponse.data.xpub;
    const mnemonic = walletResponse.data.mnemonic;

    const addressResponse = await axios.get(`/v3/bitcoin/address/${xpub}/0`);
    const walletAddress = addressResponse.data.address;

    const privateKeyResponse = await axios.post(`/v3/bitcoin/wallet/priv`, {
      index: 0,
      mnemonic,
    });
    const privateKey = privateKeyResponse.data.key;

    return {
      privateKey,
      walletAddress,
    };
  } catch (error) {
    console.log(error);
    return {
      error: { message: error },
    };
  }
};

export const getWalletBTCBalance = async (address) => {
  try {
    const walletResponse = await axios.get(
      `/v3/bitcoin/address/balance/${address}`
    );
    return walletResponse.data;
  } catch (error) {
    console.log(error);
    return {
      error: { message: error },
    };
  }
};

export const SendBTC = async (sender, receiver) => {
  // recivers [{ address: "sdfsdf", value: "sdfdf" }]
  // sender { address: "fsdfsdf", privateKey: "592" }
  try {
    const transactionResponse = await axios.post("/v3/bitcoin/transaction", {
      to: receiver,
      fromAddress: sender,
    });
    return transactionResponse.data;
  } catch (error) {
    return {
      error: { message: error },
    };
  }
};

export const getDetailsBTCTransaction = async (hash) => {
  try {
    const transactionResponse = await axios.get(
      `/v3/bitcoin/transaction/${hash}`
    );

    return transactionResponse.data;
  } catch (error) {
    return {
      error: { message: error },
    };
  }
};

export const getCryptoPriceInUSD = async (currency) => {
  try {
    const response = await axios.get(`v3/tatum/rate/${currency}?basePair=USD`);
    return response.data.value;
  } catch (error) {
    console.error(`Error fetching price for ${currency}:`, error.message);
    return {
      error: { message: error },
    };
  }
};
