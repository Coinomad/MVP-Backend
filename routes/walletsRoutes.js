import express from "express"
import { sendPolygonToEmployees } from "../controllers/walletControllers/polygonControllers"
import { sendBitcoinToEmployees } from "../controllers/walletControllers/bitcoinControllers"

const walletRouter = express.Router()



walletRouter.post("/send/btc/", sendBitcoinToEmployees)
walletRouter.post("/send/polygon/", sendPolygonToEmployees)

export default walletRouter