const express = require("express");
const dotenv = require("dotenv");
const ExpressMongoSanitize = require("express-mongo-sanitize");
const mongoose = require("mongoose");
const cors = require("cors");
const {errorMiddleware} = require("./middleware/notFoundMiddleware.js");
const waitListRouter = require("./routes/waitListRoute.js");
const employerauthRoutes = require("./routes/employerAuthRoutes.js");
const walletRouter = require("./routes/walletsRoutes.js");
const employeeRoutes = require("./routes/employeeRoutes.js");
const { createWebhookSubscription } = require("./helpers/helpers.js");
const { generatePolygonWallet } = require("./helpers/wallets/polygonWallet.js");
const {
  checkBTCAddressExist,
  generateBTCWallet,
} = require("./helpers/wallets/btcWallet.js");
const router = require("./helpers/bullBoard.js");
const morgan = require('morgan');
const helmet = require('helmet');
// const bullBoardRouter = require("./helpers/bullBoard.js");

dotenv.config();

const port = process.env.PORT || 3000;
const app = express();
// Sanitize user input
app.use(ExpressMongoSanitize());
app.use(cors());
// logger
app.use(morgan('combined'));
// Use Helmet to set security headers
app.use(helmet());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("Connection error"));

app.get("/", async (req, res) => {
  try {
    const value1 = await generatePolygonWallet();
    const value2 = await generateBTCWallet();
    const value3 = await checkBTCAddressExist(
      "tb1q3eshhdgf5g7ealzj292chtey4x6ygkp2yzyvf2"
    );
    res.status(200).json({
      success: true,
      message: "Wallets generated successfully",
      data: {
        polygonWallet: value1,
        btcWallet: value2,
        checkBTCAddressExist: value3,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "An error occurred",
    });
  }
});

// for bull ui
app.use("/admin/queues", router);

// app.use('/admin/queues', bullBoardRouter);

// /v1/api/employeeauth
app.use("/v1/api/employee", employeeRoutes);

// /v1/api/employerauth
app.use("/v1/api/employerauth", employerauthRoutes);

// /v1/api/waitlist/
app.use("/v1/api/waitlist", waitListRouter);

// /v1/api/wallet/
app.use("/v1/api/wallet", walletRouter);

// Error-handling middleware should be the last middleware added
app.use(errorMiddleware);

// Start the worker
require("./worker.js");

app.listen(port, () => {
  createWebhookSubscription();
  console.log(`Server is running on port ${port}`);
});
