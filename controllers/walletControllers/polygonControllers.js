import { SendPolygon } from "../../helpers/wallets/polygonWallet.js";
import { Employee, Employer, Transaction } from "../../model/userModel.js";

export const sendPolygonToEmployees = async (req, res) => {
  const { transactions } = req.body;
  const employerId = req.user.id;
  try {
    const employer = await Employer.findById(employerId).populate("employees");
    if (!employer) {
      return res.status(400).json({ message: "Employer not found" });
    }

    const recipients = [];
    const employeeDetails = []; // Array to store employee details

    for (const tx of transactions) {
      const { employeeId, amount } = tx;
      const employee = await Employee.findById(employeeId);

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

      if (employer.polygonBalance < amount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient balance for employee with ID ${employeeId}`,
        });
      }

      employeeDetails.push({
        employeeId: employee._id,
        employeeWalletAddress: employee.walletAddress,
        amount,
        employerAddress: employer.walletAddress,
      });

      recipients.push({
        address: employee.walletAddress,
        value: amount.toString(),
      });
    }

    
    if (recipients.length === 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: `No valid transactions to process`,
        });
    }

    // Send batch transaction using Tatum
    const response = await SendPolygon(employer.privateKey, recipients);
    if (response.error) {
      return res.status(500).json( {
        success: false,
        message: response.error.message,
      });
    }
   
    // Create and save the batch transaction record
    const transaction = new Transaction({
      employer: employer._id,
      amount: transactions.reduce((acc, tx) => acc + tx.amount, 0), // Total amount of the batch
      walletType: "Polygon",
      employerAddress: employer.walletAddress,
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
      transactionId: transaction.transactionId,
      transaction: transaction,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
