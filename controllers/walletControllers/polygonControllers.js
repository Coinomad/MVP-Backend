import {
  sendCoinToAnyOneSchema,
  sendCoinToEmployeeSchema,
} from "../../helpers/validation.js";
import { SendPolygon } from "../../helpers/wallets/polygonWallet.js";
import { Employee, Employer, Transaction } from "../../model/userModel.js";

export const sendPolygonToEmployee = async (req, res) => {
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
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${value.employeeId} not found`,
      });
    }

    if (!employer.employees.some((emp) => emp.equals(employee._id))) {
      return res.status(400).json({
        success: false,
        message: `Employee with ID ${value.employeeId} does not belong to this employer`,
      });
    }

    if (employer.polygonBalance < value.amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance`,
      });
    }

    const decryptedPrivateKey = decrypt(employer.polygonWalletprivateKey);

    const transaction = new Transaction({
      transactionId: null,
      amount: value.amount,
      walletType: "Polygon",
      senderWalletAddress: employer.polygonWalletAddress,
      receiverWalletAddress: employee.polygonWalletAddress,
      status: "Pending",
      receiverName: employee.name,
    });

    await transaction.save();

    const response = await SendPolygon(
      decryptedPrivateKey,
      employee.polygonWalletAddress,
      value.amount
    );

    if (response.error) {
      transaction.status = "Failed";
      await transaction.save();
      return res.status(500).json({
        success: false,
        message: `Transaction failed: ${response.error.message}`,
      });
    }

    transaction.transactionId = response.txId;
    transaction.status = "Success";
    await transaction.save();

    const polygonWalletBalance = await getWalletPolygonBalance(
      employer.polygonWalletAddress
    );
    if (polygonWalletBalance.error) {
      return res.status(500).json({
        success: false,
        message: `polygon wallet error:${polygonWalletBalance.error.message}`,
      });
    }

    employer.polygonBalance = polygonWalletBalance;
    employer.transactions.push(transaction._id);
    await employer.save();

    employee.transactions.push(transaction._id);
    await employee.save();

    res.status(200).json({
      success: true,
      message: "Transaction successful",
      transactionId: transaction.transactionId,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

export const sendPolygonToAnyone = async (req, res) => {
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
      return res.status(404).json({ message: "Employer not found" });
    }

    const actualBalance = employer.polygonBalance;

    if (actualBalance < value.amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance to send ${value.amount} Polygon`,
      });
    }

    const decryptedPrivateKey = decrypt(employer.polygonWalletprivateKey);

    // Create and save the transaction record
    const transaction = new Transaction({
      transactionId: null,
      amount: value.amount,
      walletType: "Polygon",
      senderWalletAddress: employer.polygonWalletAddress,
      receiverWalletAddress: value.receiverWalletAddress,
      status: "Pending",
    });

    await transaction.save();

    // Send transaction using Tatum
    const response = await SendPolygon(
      decryptedPrivateKey,
      value.receiverWalletAddress,
      value.amount
    );

    // Update transaction with transaction ID
    if (response.error) {
      transaction.status = "Failed";
      await transaction.save();
      return res.status(500).json({
        success: false,
        message: "Transaction failed",
        error: response.error.message,
      });
    }
    transaction.transactionId = response.txId;
    transaction.status = "Success";
    await transaction.save();

    const polygonWalletBalance = await getWalletPolygonBalance(
      employer.polygonWalletAddress
    );

    if (polygonWalletBalance.error) {
      console.log(polygonWalletBalance.error.message);
      return res.status(500).json({
        success: false,
        message: `Transaction occurred, but failed to update wallet balance`,
      });
    }

    // Update employer details
    employer.polygonBalance = polygonWalletBalance;
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
    res.status(500).json({ message: error.message });
  }
};

export const handleIncomingPolygonTransaction = async (req, res, walletType) => {
  try {
    const { address, amount, blockNumber, counterAddress, txId, chain } =
      req.body;

    // Find the employer associated with the address
    const employer = await Employer.findOne({
      [`${walletType}WalletAddress`]: address,
    });
    if (!employer) {
      return res.status(404).json({ error: "Employer not found" });
    }

    // Create a new transaction document
    const newTransaction = new Transaction({
      transactionId: txId,
      amount: parseFloat(amount),
      walletType: "Polygon", // Dynamic wallet type (BTC or Polygon)
      senderWalletAddress: counterAddress,
      receiverWalletAddress: address,
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
      message: "Ploygon Coins received",
    });
  } catch (error) {
    console.error("Error processing webhook:", error);

    return res.status(500).json({
      success: true,
      message: "Failed to process webhook",
    });
  }
};
