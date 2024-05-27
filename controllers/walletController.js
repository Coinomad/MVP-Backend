import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
axios.defaults.baseURL = "https://api.tatum.io";
axios.defaults.headers = {
  accept: "application/json",
  "x-api-key": process.env.APIKEY,
};

let walletAddress = "";
let privateKey = "";
let mnemonic = "";
export const generateWallet = (req, res) => {
  axios
    .get("/v3/bitcoin/wallet")
    .then((result) => {
      //   console.log("First request data:", result.data);
      const xpub = result.data.xpub;
      mnemonic = result.data.mnemonic;
      //   console.log("mnemonic", mnemonic);
      return axios.get(`/v3/bitcoin/address/${xpub}/0`);
    })
    .then((result) => {
      //   console.log("Second request data", result.data);
      walletAddress = result.data.address;
      //   console.log("walletAddress", walletAddress);
      return axios.post(`v3/bitcoin/wallet/priv`, {
        index: 0,
        mnemonic,
      });
    })
    .then((result) => {
      //   console.log("Third :", result.data);
      privateKey = result.data.key;
      //   console.log("privatekey", privateKey);
      res.status(201).send({
        privateKey,
        walletAddress,
      });
    })
    .catch((e) => {
      console.log(e);
      res.status(400).send("An error occurred");
    });
};
