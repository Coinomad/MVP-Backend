import express from "express";

import { sendBitcoinToEmployees } from "../controllers/walletControllers/bitcoinControllers.js";
import { sendPolygonToEmployees } from "../controllers/walletControllers/polygonControllers.js";
import { authMiddleware } from "../middleware/ProtectRoutes.js";

const walletRouter = express.Router();

walletRouter.post("/send/bitcoin/", authMiddleware, sendBitcoinToEmployees);
walletRouter.post("/send/polygon/", authMiddleware, sendPolygonToEmployees);

export default walletRouter;
