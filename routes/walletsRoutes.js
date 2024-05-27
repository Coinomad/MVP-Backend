import express from "express"
import { generateWallet } from "../controllers/walletController.js"

const router=express.Router()
router.get("/", generateWallet)

export default router