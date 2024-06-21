import { Employee, Employer, Transaction } from "../../model/userModel";

export const sendPolygonToEmployees = async ( req, res) => {
  const { transactions } = req.body;
  const employerId = req.user.id;
  try {
    const employer = await Employer.findById(employerId).populate("employees");
    if (!employer) {
      return res.status(400).json({ message: "Employer not found" });
    }

    const results = [];
    const errors = [];

    for (const tx of transactions) {
      const { employeeId, amount } = tx;
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        errors.push({
          success: false,
          message: `Employee with ID ${employeeId} not found`,
        });
        continue;
      }

      if (!employer.employees.some((emp) => emp.equals(employee._id))) {
        errors.push({
          success: false,
          message: `Employee with ID ${employeeId} does not belong to this employer`,
        });
        continue;
      }

      if (employer.polygonBalance < amount) {
        errors.push({
          success: false,
          message: `Insufficient balance for employee with ID ${employeeId}`,
        });
        continue;
      }

      const transaction = new Transaction({
        employer: employer._id,
        employee: employee._id,
        amount,
        walletType: "Polygon",
        senderAddress: employer.walletAddress,
        recipientAddress: employee.walletAddress,
        status: "Pending",
      });

      await transaction.save();
      // Tatum transaction
      try {
        const response = await SendPolygon(
          employer.privateKey,
          employee.walletAddress,
          amount
        );

        // Update transaction with response details
        transaction.transactionId = response.txId;
        transaction.status = "Completed";
        await transaction.save();

        // Deduct amount from employer balance and add to employee balance
        employer.polygonBalance -= amount;
        employee.polygonBalance += amount;

        await employer.save();
        await employee.save();

        employer.transactions.push(transaction._id);
        employee.transactions.push(transaction._id);

        await employer.save();
        await employee.save();

        results.push({
          success: true,
          message: "Transaction successful",
          transactionId: transaction.transactionId,
          transaction,
        });
      } catch (error) {
        transaction.status = "Failed";
        await transaction.save();
        errors.push({
          success: false,
          message: `Transaction failed for employee with ID ${employeeId}: ${error.message}`,
        });
      }
    }

    if (errors.length) {
      return res
        .status(400)
        .json({ message: "Some transactions failed", errors });
    }

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
