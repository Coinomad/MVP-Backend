import { getBitcoinActualBalance } from "../helpers/helpers.js";
import {
  getCryptoPriceInUSD,
  getWalletBTCBalance,
} from "../helpers/wallets/btcWallet.js";
import { getWalletPolygonBalance } from "../helpers/wallets/polygonWallet.js";
import { Employer } from "../model/userModel.js";

export const getTransactions = async (req, res) => {
  const employerId = req.user.id;

  try {
    const employer = await Employer.findById(employerId);
    if (!employer) {
      return res
        .status(404)
        .json({ success: false, message: "Employer not found" });
    }

    const fetchedTransactions = await employer.populate("transactions");

    res.status(200).json({
      success: true,
      message: "Transaction successful",
      data: fetchedTransactions.transactions.map((transaction, index) => ({
        senderWalletAddress: transaction.senderWalletAddress,
        amountInUSD: transaction.amountInUSD,
        receiverWalletAddress: transaction.receiverWalletAddress,
        amount: transaction.amount,
        asset: transaction.walletType,
        type: transaction.direction,
        datetime: transaction.transactionId,
        status: transaction.status,
        timestamp: transaction.datetime,
        receiverName: transaction.receiverName,
        hash: transaction.transactionId,
      })),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

export const getBalance = async (req, res) => {
  const employerId = req.user.id;

  try {
    const employer = await Employer.findById(employerId);

    const bitcoinWalletBalance = await getWalletBTCBalance(
      employer.bitcoinWalletAddress
    );
    if (bitcoinWalletBalance.error) {
      console.log("bitcoinWalletBalance.error", bitcoinWalletBalance.error);
      return res.status(500).json({
        success: false,
        message: `bitcoin wallet balance error`,
      });
    }

    const polygonWalletBalance = await getWalletPolygonBalance(
      employer.polygonWalletAddress
    );
    if (polygonWalletBalance.error) {
      return res.status(500).json({
        success: false,
        message: `polygon wallet error`,
      });
    }
    const bitcoinActualBalance = await getBitcoinActualBalance(
      Number(bitcoinWalletBalance.incoming),
      Number(bitcoinWalletBalance.incomingPending),
      Number(bitcoinWalletBalance.outgoing),
      Number(bitcoinWalletBalance.outgoingPending)
    );
    const bitcoinAmountInDollars = await getCryptoPriceInUSD("BTC");
    if (bitcoinAmountInDollars.error) {
      return res.status(500).json({
        success: false,
        message: `bitcoin wallet error`,
      });
    }
    const dollarBitcoinBalance =
      parseFloat(bitcoinAmountInDollars) * bitcoinActualBalance;

    const polygonAmountInDollars = await getCryptoPriceInUSD("MATIC");
    if (polygonAmountInDollars.error) {
      console.log("polygonAmountInDollars.error", polygonAmountInDollars.error);
      return res.status(500).json({
        success: false,
        message: `polygon wallet error`,
      });
    }
    const dollarMaticBalance =
      parseFloat(polygonAmountInDollars) * polygonWalletBalance.balance;

    res.status(200).json({
      success: true,
      message: "Transaction successful",
      data: {
        polygonAmountInDollars: Number(polygonAmountInDollars),
        bitcoinAmountInDollars: Number(bitcoinAmountInDollars),
        dollarBitcoinBalance,
        dollarMaticBalance,
        bitcoinWalletBalance: bitcoinActualBalance,
        polygonWalletBalance: Number(polygonWalletBalance.balance),
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};
