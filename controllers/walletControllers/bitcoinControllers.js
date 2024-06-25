import { decrypt } from "../../helpers/helpers.js";
import {
  sendCoinToAnyOneSchema,
  sendCoinToEmployeeSchema,
} from "../../helpers/validation.js";
import { SendBTC } from "../../helpers/wallets/btcWallet.js";
import {
  Employee,
  Employer,
  EmployerEmployeeTransaction,
} from "../../model/userModel.js";

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
    const actualBalance = getBitcoinActualBalance(
      employer.bitcoinWalletBalance.incoming,
      employer.bitcoinWalletBalance.incomingPending,
      employer.bitcoinWalletBalance.outgoing,
      employer.bitcoinWalletBalance.outgoingPending
    );

    if (actualBalance < value.amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance to send ${value.amount} BTC to employee with ID ${value.employeeId}`,
      });
    }

    const decryptedPrivateKey = decrypt(employer.bitcoinWalletprivateKey);


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
    // console.log("response", response.error.message);
    if (response.error) {
      return res.status(500).json({
        success: false,
        message: `Server error: ${response.error.message}`,
        // data: transaction,
      });
    }
    // console.log("response", response);
    // Create and save the transaction record
    const transaction = new EmployerEmployeeTransaction({
      transactionId: response.txId,
      amount: value.amount,
      walletType: "BTC",
      employerWalletAddress: employer.bitcoinWalletAddress,
      employeeWalletAddress: employee.walletAddress,
      employer: employer._id,
      employee: employee._id,
      status: "Completed",
    });

    await transaction.save();

    // Update employer balance and transaction history
    employer.bitcoinWalletBalance -= value.amount;
    employer.transactions.push(transaction._id);
    await employer.save();

    // Update employee's balance and transaction history
    employee.bitcoinWalletBalance += value.amount;
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
      return res.status(404).json({ message: "Employer not found" });
    }


    const actualBalance = getBitcoinActualBalance(
      employer.bitcoinWalletBalance.incoming,
      employer.bitcoinWalletBalance.incomingPending,
      employer.bitcoinWalletBalance.outgoing,
      employer.bitcoinWalletBalance.outgoingPending
    );

    if (actualBalance < value.amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance to send ${amount} BTC`,
      });
    }

    const decryptedPrivateKey = decrypt(employer.bitcoinWalletprivateKey);

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
      return res.status(500).json({
        success: false,
        message: `Server error: ${response.error.message}`,
      });
    }

    // Create and save the transaction record
    const transaction = new EmployerTransaction({
      transactionId: response.txId,
      amount: value.amount,
      walletType: "BTC",
      employerWalletAddress: employer.bitcoinWalletAddress,
      receiverWalletAddress: value.receiverWalletAddress,
      employer: employer._id,
      status: "Completed",
    });

    await transaction.save();

    // Update employer balance and transaction history
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
