import express from "express";
import { Cleanbody } from "../middleware/Cleanbody";

const authRoutes = express.Router();

authRoutes.post("/signup", Signup);

authRoutes.patch("/activate", Activate);

authRoutes.post("/login", Login);

authRoutes.patch("/forgot", ForgotPassword);

authRoutes.patch("/reset", ResetPassword);

authRoutes.get("/logout", validateToken, Logout);

export default authRoutes;
