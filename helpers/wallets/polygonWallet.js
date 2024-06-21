import axios from "axios";
import dotenv from "dotenv";



export const generatePolygonWallet = async () => {
  try {
    const walletResponse = await axios.get("/polygon/wallet");
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

export const getWalletPolygonBalance = async (address) => {
  try {
    const walletResponse = await axios.get(`/polygon/address/balance/${address}`);
    return walletResponse.data;
  } catch (error) {
    return {
      error: { message: error },
    };
  }
};

export const SendPolygon = async (senderPrivateKey, receiverWalletAddress,amount) => {

  try {
    const transactionResponse = await axios.post("/polygon/transaction",{
        currency: 'MATIC',
        to: receiverWalletAddress,
        amount,
        fromPrivateKey: senderPrivateKey,
       
      });
   

    return transactionResponse.data;
  } catch (error) {
    return {
      error: { message: error },
    };
  }
};




export const getDetailsPolygonTransaction = async (hash) => {
  try {
    const transactionResponse = await axios.get(`/polygon/transaction/${hash}`);
    return transactionResponse.data;
  } catch (error) {
    return {
      error: { message: error },
    };
  }
};
