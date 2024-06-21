import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

axios.defaults.baseURL = "https://api.tatum.io/v3";
axios.defaults.headers = {
  accept: "application/json",
  "x-api-key": process.env.APIKEY,
};

export const generateBTCWallet = async () => {
  try {
    const walletResponse = await axios.get("/bitcoin/wallet");
    const xpub = walletResponse.data.xpub;
    const mnemonic = walletResponse.data.mnemonic;

    const addressResponse = await axios.get(`/bitcoin/address/${xpub}/0`);
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

export const getWalletBTCBalance = async (address) => {
  try {
    const walletResponse = await axios.get(`/bitcoin/address/balance/${address}`);
    return walletResponse.data;
  } catch (error) {
    return {
      error: { message: error },
    };
  }
};

export const SendBTC = async (sender, receiver) => {
  // recivers [{ address: "sdfsdf", value: "sdfdf" }]
  // sender { address: "fsdfsdf", privateKey: "592" }
  try {
    const transactionResponse = await axios.post("/bitcoin/transaction", {
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
    const transactionResponse = await axios.get(`/bitcoin/transaction/${hash}`);

    return transactionResponse.data;
  } catch (error) {
    return {
      error: { message: error },
    };
  }
};
