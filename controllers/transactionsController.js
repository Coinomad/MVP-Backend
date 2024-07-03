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
    res.status(500).json({ message: error.message });
  }
};
