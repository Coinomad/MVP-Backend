import { decrypt } from "../../helpers/helpers.js";
import { sendBitCoinSchema } from "../../helpers/validation.js";
import { SendBTC } from "../../helpers/wallets/btcWallet.js";
import { Employee, Employer, Transaction } from "../../model/userModel.js";

export const sendBitcoinToEmployee = async (req, res) => {
  const employerId = req.user.id;

  try {
    const { value, error } = sendBitCoinSchema.validate(req.body);
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

    if (employer.bitcoinWalletBalance < value.amount) {
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
      [{ address: employee.bitcoinWalletAddress, value: value.amount }]
    );
    console.log("response", response.error.message);
    if (response.error) {
      return res.status(500).json({
        success: false,
        message: `Server error: ${response.error.message}`,
        // data: transaction,
      });
    }
    // console.log("response", response);
    // Create and save the transaction record
    const transaction = new Transaction({
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
    employer.bitcoinWalletBalance -= amount;
    employer.transactions.push(transaction._id);
    await employer.save();

    // Update employee's balance and transaction history
    employee.bitcoinWalletBalance += amount;
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
