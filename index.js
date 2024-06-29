import express from "express";
import dotenv from "dotenv";
import ExpressMongoSanitize from "express-mongo-sanitize";
import { notFoundMiddleware } from "./middleware/notFoundMiddleware.js";
import mongoose from "mongoose";
import waitListRouter from "./routes/waitListRoute.js";
import cors from "cors";
import employerauthRoutes from "./routes/employerAuthRoutes.js";;
import walletRouter from "./routes/walletsRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import { createWebhookSubscription } from "./helpers/helpers.js";

dotenv.config();

const port = process.env.PORT || 3000;
const app = express();
// Sanitize user input
app.use(ExpressMongoSanitize());
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("Connection error"));



// /v1/api/employeeauth
app.use("/v1/api/employee", employeeRoutes);

// /v1/api/employerauth
app.use("/v1/api/employerauth", employerauthRoutes);

// /v1/api/waitlist/
app.use("/v1/api/waitlist", waitListRouter);

// /v1/api/wallet/
app.use("/v1/api/wallet", walletRouter);

// for notfound 404
app.use(notFoundMiddleware);

app.listen(port, () => {
  createWebhookSubscription();
  console.log(`Server is running on port ${port}`);
});
