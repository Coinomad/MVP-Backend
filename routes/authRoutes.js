import express from "express";
import { Activate, Signup } from "../controllers/authController.js";


const authRoutes = express.Router();

authRoutes.post("/signup", Signup);

authRoutes.patch("/activate", Activate);

// authRoutes.post("/login", Login);

// authRoutes.patch("/forgot", ForgotPassword);

// authRoutes.patch("/reset", ResetPassword);

// authRoutes.get("/logout", validateToken, Logout);

export default authRoutes;
