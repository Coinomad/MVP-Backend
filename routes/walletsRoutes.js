const express = require("express");

const { authMiddleware } = require("../middleware/ProtectRoutes.js");
const {
  CheckBTCWalletAdressExists,
  handleIncomingBitcoinTransaction,
  scheduleBitcoinEmployeeTranscation,
  sendBitcoinToAnyone,
} = require("../controllers/walletControllers/bitcoinControllers.js");
const {
  checkPolygonWalletAdressExists,
  handleIncomingPolygonTransaction,
  schedulePolygonEmployeeTranscation,
  sendPolygonToAnyone,
} = require("../controllers/walletControllers/polygonControllers.js");
const {
  getBalance,
  getTransactions,
} = require("../controllers/transactionsController.js");

const walletRouter = express.Router();

walletRouter.post(
  "/schedule-transaction/bitcoin/",
  authMiddleware,
  scheduleBitcoinEmployeeTranscation
);

walletRouter.post(
  "/schedule-transaction/polygon/",
  authMiddleware,
  schedulePolygonEmployeeTranscation
);

walletRouter.post(
  "/send-to-employee/polygon/",
  authMiddleware,
  schedulePolygonEmployeeTranscation
);

walletRouter.post(
  "/send-to-anyone/polygon/",
  authMiddleware,
  sendPolygonToAnyone
);
walletRouter.post(
  "/send-to-anyone/bitcoin/",
  authMiddleware,
  sendBitcoinToAnyone
);

walletRouter.post("/receive/bitcoin", handleIncomingBitcoinTransaction);

walletRouter.post("/receive/polygon", handleIncomingPolygonTransaction);

walletRouter.get("/transactions", authMiddleware, getTransactions);

walletRouter.get("/balance", authMiddleware, getBalance);

walletRouter.get(
  "/check-wallet/bitcoin/:address/",
  authMiddleware,
  CheckBTCWalletAdressExists
);

walletRouter.get(
  "/check-wallet/polygon/:address/",
  authMiddleware,
  checkPolygonWalletAdressExists
);

module.exports = walletRouter;
