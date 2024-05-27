import express from "express";
import dotenv from 'dotenv';
import authRoutesRouter from "./routes/authRoutes.js";
import ExpressMongoSanitize from "express-mongo-sanitize";
import { notFoundMiddleware } from "./middleware/notFoundMiddleware.js";






dotenv.config();

const port = process.env.PORT||3000;
const app = express();
// Sanitize user input 
app.use(ExpressMongoSanitize());


app.use(express.json());
app.use(express.urlencoded({ extended: true }));




// /v1/api/auth/
app.use("/v1/api/auth", authRoutesRouter);
// for notfound
app.use(notFoundMiddleware);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  
});