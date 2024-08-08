const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

axios.defaults.baseURL = 'https://api.tatum.io';
axios.defaults.headers = {
  accept: 'application/json',
  'x-api-key': process.env.APIKEY,
};

const generateBTCWallet = async () => {
  try {
    const walletResponse = await axios.get('/v3/bitcoin/wallet');
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
      error: { message: error.message },
    };
  }
};

const getWalletBTCBalance = async (address) => {
  try {
    const walletResponse = await axios.get(
      `/v3/bitcoin/address/balance/${address}`
    );
    return walletResponse.data;
  } catch (error) {
    console.log(error);
    return {
      error: { message: error.message },
    };
  }
};

const sendBTC = async (sender, receiver) => {
  try {
    const transactionResponse = await axios.post('/v3/bitcoin/transaction', {
      to: receiver,
      fromAddress: sender,
    });
    return transactionResponse.data;
  } catch (error) {
    return {
      error: { message: error.message },
    };
  }
};

const checkBTCAddressExist = async (walletAddress) => {
  try {
    const walletResponse = await axios.get(
      `/v3/bitcoin/address/balance/${walletAddress}`
    );

    return walletResponse.data ? true : false;
  } catch (error) {
    console.log(error);
    return false;
  }
};

const getDetailsBTCTransaction = async (hash) => {
  try {
    const transactionResponse = await axios.get(
      `/v3/bitcoin/transaction/${hash}`
    );

    return transactionResponse.data;
  } catch (error) {
    return {
      error: { message: error.message },
    };
  }
};

const getCryptoPriceInUSD = async (currency) => {
  try {
    const response = await axios.get(`v3/tatum/rate/${currency}?basePair=USD`);
    return response.data.value;
  } catch (error) {
    console.error(`Error fetching price for ${currency}:`, error.message);
    return {
      error: { message: error.message },
    };
  }
};

module.exports = {
  generateBTCWallet,
  getWalletBTCBalance,
  sendBTC,
  checkBTCAddressExist,
  getDetailsBTCTransaction,
  getCryptoPriceInUSD,
};
