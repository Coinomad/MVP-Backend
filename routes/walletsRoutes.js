import express from "express";
import { sendPolygonToEmployees } from "../controllers/walletControllers/polygonControllers";
import { sendBitcoinToEmployees } from "../controllers/walletControllers/bitcoinControllers";
import { authMiddleware } from "../middleware/ProtectRoutes";

const walletRouter = express.Router();

walletRouter.post("/send/bitcoin/", authMiddleware, sendBitcoinToEmployees);
walletRouter.post("/send/polygon/", authMiddleware, sendPolygonToEmployees);

export default walletRouter;
