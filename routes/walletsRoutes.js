import express from "express";

import { authMiddleware } from "../middleware/ProtectRoutes.js";
import {
  CheckBTCWalletAdressExists,
  handleIncomingBitcoinTransaction,
  scheduleBitcoinEmployeeTranscation,
  sendBitcoinToAnyone,
} from "../controllers/walletControllers/bitcoinControllers.js";
import {
  checkPolygonWalletAdressExists,
  handleIncomingPolygonTransaction,
  schedulePolygonEmployeeTranscation,
  sendPolygonToAnyone,
} from "../controllers/walletControllers/polygonControllers.js";
import {
  getBalance,
  getTransactions,
} from "../controllers/transactionsController.js";

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

export default walletRouter;
