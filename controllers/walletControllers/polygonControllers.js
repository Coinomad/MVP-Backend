import { decrypt, schedulePayment } from "../../helpers/helpers.js";
import {
  sendCoinToAnyOneSchema,
  sendCoinToEmployeeSchema,
} from "../../helpers/validation.js";
import { getCryptoPriceInUSD } from "../../helpers/wallets/btcWallet.js";
import {
  chekPolygonWalletAdressExists,
  getWalletPolygonBalance,
  SendPolygon,
} from "../../helpers/wallets/polygonWallet.js";
import {
  Employee,
  Employer,
  ScheduledTransaction,
  Transaction,
} from "../../model/userModel.js";

export const schedulePolygonEmployeeTranscation = async (req, res) => {
  const employerId = req.user.id;
  const asset = "polygon";
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
      return res.status(404).json({
        success: false,
        message: `Employer not found`,
      });
    }

    const employee = await Employee.findById(value.employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${value.employeeId} not found`,
      });
    }

    if (employee.scheduleTransaction) {
      return res.status(400).json({
        success: false,
        message: `Employee Salary Already scheduled`,
      });
    }


    
    if (!employer.employees.some((emp) => emp.equals(employee._id))) {
      return res.status(400).json({
        success: false,
        message: `Employee with ID ${value.employeeId} does not belong to this employer`,
      });
    }
    const polygonWalletBalance = await getWalletPolygonBalance(
      employer.polygonWalletAddress
    );
    if (polygonWalletBalance < value.amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance`,
      });
    }

    const scheduledTransaction = ScheduledTransaction({
      employer: employer._id,
      employee: employee._id,
      frequency: value.frequency,
      scheduledDate: value.hour,
      amount: value.amount,
      walletType: "Polygon",
    });
    await scheduledTransaction.save();

    employer.scheduleTransaction.push(scheduledTransaction._id);
    await employer.save();
    employee.scheduleTransaction = scheduledTransaction._id;
    await employee.save();
    // const { hour, minute, day, date } = value;
    // console.log(minute, hour, day, date);
    // await schedulePayment(
    //   employer._id,
    //   employee._id,
    //   value,
    //   asset,
    //   hour,
    //   minute,
    //   day,
    //   date
    // );
    return res.status(200).json({
      success: true,
      message: `Payment scheduled successfully`,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

export const sendPolygonToEmployee = async (req, res) => {
  const { employerId, employeeId, asset, scheduledTransactionId, value } = req;
  try {
    const employee = await Employee.findById(employeeId);
    const employer = await Employer.findById(employerId);

    const decryptedPrivateKey = decrypt(employer.polygonWalletprivateKey);
    const rate = await getCryptoPriceInUSD("MATIC");
    if (rate.error) {
      return res.status(500).json({
        success: false,
        message: `Error getting exchange rate`,
      });
    }
    const amountInUSD = value.amount * rate;
    const transaction = new Transaction({
      transactionId: null,
      amount: value.amount,
      walletType: "Polygon",
      senderWalletAddress: employer.polygonWalletAddress,
      receiverWalletAddress: employee.walletAddress,
      status: "Pending",
      receiverName: employee.name,
      amountInUSD: amountInUSD,
      datetime: new Date().toISOString(),
    });

    await transaction.save();

    const response = await SendPolygon(
      decryptedPrivateKey,
      employee.walletAddress,
      value.amount
    );

    if (response.error) {
      console.log(response.error);
      transaction.status = "Failed";
      await transaction.save();
      employer.transactions.push(transaction._id);
      await employer.save();
      return res.status(500).json({
        success: false,
        message: `Transaction failed`,
        data: {
          transactionId: transaction.transactionId,
          transaction,
        },
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
      return res.status(404).json({
        success: false,
        message: `Employer not found`,
      });
    }

    const actualBalance = employer.polygonBalance;

    if (actualBalance < value.amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance to send ${value.amount} Polygon`,
      });
    }

    const decryptedPrivateKey = decrypt(employer.polygonWalletprivateKey);

    const rate = await getCryptoPriceInUSD("MATIC");
    if (rate.error) {
      return res.status(500).json({
        success: false,
        message: `Error getting exchange rate`,
      });
    }
    const amountInUSD = value.amount * rate;
    // Create and save the transaction record
    const transaction = new Transaction({
      transactionId: null,
      amount: value.amount,
      walletType: "Polygon",
      senderWalletAddress: employer.polygonWalletAddress,
      receiverWalletAddress: value.receiverWalletAddress,
      status: "Pending",
      amountInUSD: amountInUSD,
      datetime: new Date().toISOString(),
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
      employer.transactions.push(transaction._id);
      await employer.save();
      return res.status(500).json({
        success: false,
        message: "Transaction failed",
        data: {
          transactionId: transaction.transactionId,
          transaction,
        },
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

export const handleIncomingPolygonTransaction = async (req, res) => {
  try {
    const { address, amount, blockNumber, counterAddress, txId, chain } =
      req.body;

    // Find the employer associated with the address
    const employer = await Employer.findOne({
      polygonWalletAddress: address,
    });
    if (!employer) {
      return res.status(404).json({
        success: false,
        message: `Employer not found`,
      });
    }

    const rate = await getCryptoPriceInUSD("MATIC");
    if (rate.error) {
      return res.status(500).json({
        success: false,
        message: `Error getting exchange rate`,
      });
    }
    const amountInUSD = amount * rate;
    // Create a new transaction document
    const senderWalletAddress = counterAddress ? counterAddress : "Unknown";
    const newTransaction = new Transaction({
      transactionId: txId,
      amount: parseFloat(amount),
      walletType: "Polygon", // Dynamic wallet type (BTC or Polygon)
      senderWalletAddress: senderWalletAddress,
      receiverWalletAddress: address,
      direction: "Incoming",
      amountInUSD: amountInUSD,
      status: "Success", // Assuming the transaction is successful as it reached this point
      datetime: new Date().toISOString(),
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

export const checkPolygonWalletAdressExists = async (req, res) => {
  try {
    const { address } = req.body;
    const response = await chekPolygonWalletAdressExists(address);
    return res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
