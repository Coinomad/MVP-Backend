const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const generatePolygonWallet = async () => {
  try {
    const walletResponse = await axios.get('/v3/polygon/wallet');
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
      error: { message: error.message },
    };
  }
};

const getWalletPolygonBalance = async (address) => {
  try {
    const walletResponse = await axios.get(
      `/v3/polygon/account/balance/${address}`
    );
    return walletResponse.data;
  } catch (error) {
    console.log(error);
    return {
      error: { message: error.message },
    };
  }
};

const checkPolygonWalletAddressExists = async (address) => {
  try {
    const walletResponse = await axios.get(
      `/v3/polygon/account/balance/${address}`
    );
    return walletResponse.data ? true : false;
  } catch (error) {
    console.log(error);
    return false;
  }
};

const sendPolygon = async (senderPrivateKey, receiverWalletAddress, amount) => {
  try {
    const transactionResponse = await axios.post('/v3/polygon/transaction', {
      currency: 'MATIC',
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

const getDetailsPolygonTransaction = async (hash) => {
  try {
    const transactionResponse = await axios.get(
      `/v3/polygon/transaction/${hash}`
    );
    return transactionResponse.data;
  } catch (error) {
    return {
      error: { message: error.message },
    };
  }
};

module.exports = {
  generatePolygonWallet,
  getWalletPolygonBalance,
  checkPolygonWalletAddressExists,
  sendPolygon,
  getDetailsPolygonTransaction,
};
