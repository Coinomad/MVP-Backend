import axios from "axios";
import dotenv from "dotenv";

export const generatePolygonWallet = async () => {
  try {
    const walletResponse = await axios.get("/v3/polygon/wallet");
    const xpub = walletResponse.data.xpub;
    const mnemonic = walletResponse.data.mnemonic;

    const addressResponse = await axios.get(`/v3/polygon/address/${xpub}/0`);
    const walletAddress = addressResponse.data.address;

    const privateKeyResponse = await axios.post(`/v3/polygon/wallet/priv`, {
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

export const getWalletPolygonBalance = async (address) => {
  try {
    const walletResponse = await axios.get(
      `/v3/polygon/account/balance/${address}`
    );
    return walletResponse.data;
  } catch (error) {
    console.log(error);
    return {
      error: { message: error },
    };
  }
};

export const chekPolygonWalletAdressExists = async (address) => {
  try {
    const walletResponse = await axios.get(
      `/v3/polygon/account/balance/${address}`
    );
    if (walletResponse.data) return true;
    return false;
  } catch (error) {
    console.log(error);
    return false
  }
};

export const SendPolygon = async (
  senderPrivateKey,
  receiverWalletAddress,
  amount
) => {
  // console.log("senderPrivateKey",senderPrivateKey);

  try {
    const transactionResponse = await axios.post("/v3/polygon/transaction", {
      currency: "MATIC",
      to: receiverWalletAddress,
      amount: amount.toString(),
      fromPrivateKey: senderPrivateKey,
    });

    return transactionResponse.data;
  } catch (error) {
    return {
      error: { message: error.message },
    };
  }
};

export const getDetailsPolygonTransaction = async (hash) => {
  try {
    const transactionResponse = await axios.get(
      `/v3/polygon/transaction/${hash}`
    );
    return transactionResponse.data;
  } catch (error) {
    return {
      error: { message: error },
    };
  }
};
