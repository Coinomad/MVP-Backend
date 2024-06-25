import express from "express";

import { sendPolygonToEmployees } from "../controllers/walletControllers/polygonControllers.js";
import { authMiddleware } from "../middleware/ProtectRoutes.js";
import { sendBitcoinToEmployee } from "../controllers/walletControllers/bitcoinControllers.js";

const walletRouter = express.Router();

walletRouter.post("/send/bitcoin/", authMiddleware, sendBitcoinToEmployee);
walletRouter.post("/send/polygon/", authMiddleware, sendPolygonToEmployees);

export default walletRouter;
