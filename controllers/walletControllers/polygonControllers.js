import { sendCoinToAnyOneSchema, sendCoinToEmployeeSchema } from "../../helpers/validation.js";
import { SendPolygon } from "../../helpers/wallets/polygonWallet.js";
import {
  Employee,
  Employer,
  Transaction,
} from "../../model/userModel.js";

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

    const response = await SendPolygon(
      decryptedPrivateKey,
      employee.polygonWalletAddress,
      value.amount
    );

    if (response.error) {
      return res.status(500).json({
        success: false,
        message: `Transaction failed: ${response.error.message}`,
      });
    }

    const transaction = new Transaction({
      transactionId: response.txId,
      amount: value.amount,
      walletType: "Polygon",
      senderWalletAddress: employer.polygonWalletAddress,
      receiverWalletAddress: employee.polygonWalletAddress,
      status: "Success",
      receiverName: employee.name,
    });

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

    // Send transaction using Tatum
    const response = await SendPolygon(
      decryptedPrivateKey,
      value.receiverWalletAddress,
      value.amount
    );
    if (response.error) {
      return res.status(500).json({
        success: false,
        message: `Server error: ${response.error.message}`,
      });
    }

    // Create and save the transaction record
    const transaction = new Transaction({
      transactionId: response.txId,
      amount: value.amount,
      walletType: "Polygon",
      senderWalletAddress: employer.polygonWalletAddress,
      receiverWalletAddress: value.receiverWalletAddress,
      status: "Success",
    });

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
