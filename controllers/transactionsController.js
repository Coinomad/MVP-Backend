import { Employer } from "../model/userModel";

export const getTransactions = async (req, res) => {
  const employerId = req.user.id;

  try {
    const employer = await Employer.findById(employerId);
    if (!employer) {
      return res.status(404).json({ message: "Employer not found" });
    }

    const transactions = await employer.populate("transactions");

    res.status(200).json({
      success: true,
      message: "Transaction successful",
      data: {
        transactions: transactions.transactions.map((transaction, index) => ({
          senderWalletAddress: transaction.senderWalletAddress,
          receiverWalletAddress: transaction.receiverWalletAddress,
          amount: transaction.amount,
          asset: transaction.asset,
          direction: transaction.direction,
          datetime: transaction.transactionId,
          status: transaction.status,
          timestamp: transaction.datetime,
          name: transaction.receiverName,
          hash: transaction.transactionId,
        })),
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
