import express from "express";

import { authMiddleware } from "../middleware/ProtectRoutes.js";
import {
  sendBitcoinToAnyone,
  sendBitcoinToEmployee,
} from "../controllers/walletControllers/bitcoinControllers.js";
import {
  sendPolygonToAnyone,
  sendPolygonToEmployee,
} from "../controllers/walletControllers/polygonControllers.js";
import { getTransactions } from "../controllers/transactionsController.js";

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

walletRouter.post("/transactions", authMiddleware, getTransactions);

export default walletRouter;
