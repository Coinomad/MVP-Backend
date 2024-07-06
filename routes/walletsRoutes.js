import express from "express";

import { authMiddleware } from "../middleware/ProtectRoutes.js";
import {
  handleIncomingBitcoinTransaction,
  sendBitcoinToAnyone,
  sendBitcoinToEmployee,
} from "../controllers/walletControllers/bitcoinControllers.js";
import {
  handleIncomingPolygonTransaction,
  sendPolygonToAnyone,
  sendPolygonToEmployee,
} from "../controllers/walletControllers/polygonControllers.js";
import { getBalance, getTransactions } from "../controllers/transactionsController.js";

const walletRouter = express.Router();

walletRouter.post(
  "/send-to-employee/bitcoin/",
  authMiddleware,
  sendBitcoinToEmployee
);
walletRouter.post(
  "/send-to-employee/polygon/",
  authMiddleware,
  sendPolygonToEmployee
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

walletRouter.post('/receive/bitcoin', handleIncomingBitcoinTransaction);

walletRouter.post('/receive/polygon', handleIncomingPolygonTransaction);

walletRouter.get("/transactions", authMiddleware, getTransactions);

walletRouter.get("/balance", authMiddleware, getBalance);

export default walletRouter;
