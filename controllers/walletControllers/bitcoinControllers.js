import { decrypt, getBitcoinActualBalance } from "../../helpers/helpers.js";
import {
  sendCoinToAnyOneSchema,
  sendCoinToEmployeeSchema,
} from "../../helpers/validation.js";
import { getWalletBTCBalance, SendBTC } from "../../helpers/wallets/btcWallet.js";
import { Employee, Employer, Transaction } from "../../model/userModel.js";

export const sendBitcoinToEmployee = async (req, res) => {
  const employerId = req.user.id;

  try {
    const { value, error } = sendCoinToEmployeeSchema.validate(req.body);
    if (error) {
      console.log(error.message);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    const employer = await Employer.findById(employerId).populate("employees");
    if (!employer) {
      return res.status(404).json({ message: "Employer not found" });
    }

    const employee = await Employee.findById(value.employeeId);
    if (!employee) {
      return res.status(400).json({
        success: false,
        message: `Employee with ID ${value.employeeId} not found`,
      });
    }

    // Ensure the employee belongs to the employer
    if (!employer.employees.some((emp) => emp.equals(employee._id))) {
      return res.status(400).json({
        success: false,
        message: `Employee with ID ${value.employeeId} does not belong to this employer`,
      });
    }
    const actualBalance = await getBitcoinActualBalance(
      employer.bitcoinWalletBalance.incoming,
      employer.bitcoinWalletBalance.incomingPending,
      employer.bitcoinWalletBalance.outgoing,
      employer.bitcoinWalletBalance.outgoingPending
    );

    if (actualBalance < value.amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance to send ${value.amount} bitcoin`,
      });
    }

    const decryptedPrivateKey = decrypt(employer.bitcoinWalletprivateKey);
    const transaction = new transaction({
      transactionId: null,
      amount: value.amount,
      walletType: "BTC",
      senderWalletAddress: employer.bitcoinWalletAddress,
      receiverWalletAddress: employee.walletAddress,
      status: "Pending",
      receiverName: employee.name,
    });

    // Send transaction using Tatum
    const response = await SendBTC(
      [
        {
          address: employer.bitcoinWalletAddress,
          privateKey: decryptedPrivateKey,
        },
      ],
      [{ address: employee.walletAddress, value: value.amount }]
    );

    if (response.error) {
      transaction.status = "Failed";
      await transaction.save();
      console.log(response.error);
      return res.status(500).json({
        success: false,
        message: `Transaction failed`,
      });
    }

    transaction.transactionId = response.txId;
    transaction.status = "Success";
    await transaction.save();

    const employerbitcoinWalletBalance = await getWalletBTCBalance(
      employer.bitcoinWalletAddress
    );
    if ( employerbitcoinWalletBalance.error) {
      return res.status(500).json({
        success: false,
        message: `Error getting bitcoin wallet balance`,
      });
    }
    // Update employer balance and transaction history
    employer.bitcoinWalletBalance = employerbitcoinWalletBalance;
    employer.transactions.push(transaction._id);
    await employer.save();

    // Update employee's balance and transaction history
    employee.transactions.push(transaction._id);
    await employee.save();

    res.status(200).json({
      success: true,
      message: "Transaction successful",
      data: {
        transactionId: transaction.transactionId,
        transaction,
      },
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: `Error sending bitcoin to employee`,
    });
  }
};

export const sendBitcoinToAnyone = async (req, res) => {
  const employerId = req.user.id;

  try {
    const { value, error } = sendCoinToAnyOneSchema.validate(req.body);
    if (error) {
      console.log(error.message);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    const employer = await Employer.findById(employerId);
    if (!employer) {
      return res.status(404).json({
        success: false,
        message: `Employer not found`,
      });
    }

    const actualBalance = await getBitcoinActualBalance(
      employer.bitcoinWalletBalance.incoming,
      employer.bitcoinWalletBalance.incomingPending,
      employer.bitcoinWalletBalance.outgoing,
      employer.bitcoinWalletBalance.outgoingPending
    );

    if (actualBalance < value.amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance to send ${value.amount} bitcoin`,
      });
    }

    const decryptedPrivateKey = decrypt(employer.bitcoinWalletprivateKey);

    // Create and save the transaction record
    const transaction = new Transaction({
      transactionId: null,
      amount: value.amount,
      walletType: "BTC",
      senderWalletAddress: employer.bitcoinWalletAddress,
      receiverWalletAddress: value.receiverWalletAddress,
      status: "Pending",
    });

    // Send transaction using Tatum
    const response = await SendBTC(
      [
        {
          address: employer.bitcoinWalletAddress,
          privateKey: decryptedPrivateKey,
        },
      ],
      [{ address: value.receiverWalletAddress, value: Number(value.amount) }]
    );

    if (response.error) {
      transaction.status = "Failed";
      await transaction.save();
      console.log(response.error);
      return res.status(500).json({
        success: false,
        message: `Transaction Failed`,
      });
    }

    transaction.transactionId = response.txId;
    transaction.status = "Success";
    await transaction.save();

    // Update employer balance and transaction history
    const employerbitcoinWalletBalance = await getWalletBTCBalance(
      employer.bitcoinWalletAddress
    );
    if (employerbitcoinWalletBalance.error) {
      console.log(response.error);
      return res.status(500).json({
        success: false,
        message: `Error getting bitcoin wallet balance`,
      });
    }

    employer.bitcoinWalletBalance = employerbitcoinWalletBalance;
    employer.transactions.push(transaction._id);
    await employer.save();

    res.status(200).json({
      success: true,
      message: "Transaction successful",
      data: {
        transactionId: transaction.transactionId,
        transaction,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: `Error sending bitcoin`,
    });
  }
};

export const handleIncomingBitcoinTransaction = async (req, res, walletType) => {
  console.log("trigerrng");
  try {
    const { address, amount, blockNumber, counterAddress, txId, chain } =
      req.body;

    // Find the employer associated with the address
    const employer = await Employer.findOne({
      bitcoinWalletAddress: address,
    });
    if (!employer) {
      return res.status(404).json({
        success: false,
        message: `Employer not found`,
      });
    }

    // Create a new transaction document
      // Check if counterAddress is null and handle it accordingly
  const senderWalletAddress = counterAddress ? counterAddress : "Unknown";
    const newTransaction = new Transaction({
      transactionId: txId,
      amount: parseFloat(amount),
      walletType:"BTC", // Dynamic wallet type (BTC or Polygon)
      senderWalletAddress,
      receiverWalletAddress: address,
      receiverName: employer.organizationName, // Optional: Add employer info if needed
      direction: "Incoming",
      status: "Success", // Assuming the transaction is successful as it reached this point
    });

    // Save the transaction to the database
    await newTransaction.save();

    // Add transaction to employer's transactions
    employer.transactions.push(newTransaction._id);
    await employer.save();

    // Respond with success
    res.status(201).json({
      success: true,
      message: "Bitcoins received",
    });
  } catch (error) {
    console.error("Error processing webhook:", error);

    return res.status(500).json({
      success: failed,
      message: "Failed to process webhook",
    });
  }
};
