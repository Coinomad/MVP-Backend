import { decrypt } from "../../helpers/helpers.js";
import { SendBTC } from "../../helpers/wallets/btcWallet.js";
import { Employee, Employer, Transaction } from "../../model/userModel.js";

export const sendBitcoinToEmployees = async (req, res) => {
  const { transactions } = req.body; // [{ employeeId, amount }]
  const employeremail = req.user.email;
  console.log(transactions);

  try {
    const employer = await Employer.findOne({email:employeremail}).populate("employees");
    if (!employer) {
      return res.status(404).json({ message: "Employer not found" });
    }

    const recipients = [];
    const employeeDetails = []; // Array to store employee details

    for (const tx of transactions) {
      const { employeeId, amount } = tx;
      console.log("employeeId",employeeId);
      const employee = await Employee.findById(employeeId);
      console.log("employee",employee._id);

      if (!employee) {
        return res.status(400).json({
          success: false,
          message: `Employee with ID ${employeeId} not found`,
        });
      }

      // Ensure the employee belongs to the employer
      if (!employer.employees.some((emp) => emp.equals(employee._id))) {
        return res.status(400).json({
          success: false,
          message: `Employee with ID ${employeeId} does not belong to this employer`,
        });
      }

      if (employer.bitcoinWalletBalance.incoming < amount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient balance for employee with ID ${employeeId}`,
        });
      }

      employeeDetails.push({
        employeeId: employeeId,
        employeeWalletAddress: employee.bitcoinWalletAddress,
        amount,
        employerAddress: employer.bitcoinWalletAddress,
      });

      recipients.push({
        address: employee.bitcoinWalletAddress,
        value: Number(amount),
      });
    }

    if (recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No valid transactions to process`,
      });
    }

     const decryptedPrivateKey = decrypt(employer.bitcoinWalletprivateKey);

    // Send batch transaction using Tatum
    const response = await SendBTC(
      [{ address: employer.bitcoinWalletAddress, privateKey: decryptedPrivateKey}],
      recipients
    );
    if (response.error) {
      return res.status(500).json({
        success: false,
        message: `Server error: ${response.error.message}`,
      });
    }

    // Create and save the batch transaction record
    const transaction = new Transaction({
      employer: employer._id,
      amount: transactions.reduce((acc, tx) => acc + tx.amount, 0), // Total amount of the batch
      walletType: "Polygon",
      employerAddress: employer.bitcoinWalletAddress,
      employees: employeeDetails, // Add employee details
      transactionId: response.txId, // Use batch response txId
      status: "Completed",
    });

    await transaction.save();

    // Update employer balance and transaction history
    employer.polygonBalance -= transactions.reduce(
      (acc, tx) => acc + tx.amount,
      0
    );
    employer.transactions.push(transaction._id);
    await employer.save();

    // Update employees' balances and transaction histories
    for (const detail of employeeDetails) {
      const employee = await Employee.findById(detail.employeeId);
      employee.polygonBalance += detail.amount;
      employee.transactions.push(transaction._id);
      await employee.save();
    }

    res.status(200).json({
      success: true,
      message: "Transaction successful",
      data: {
        transactionId: transaction.transactionId,
        transaction: transaction,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
