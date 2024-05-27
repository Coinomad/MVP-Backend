
import express from "express"
import { generateWallet } from "../controllers/walletController.js"

const walletRoutes=express.Router()

walletRoutes.get("/", generateWallet)

export default walletRoutes