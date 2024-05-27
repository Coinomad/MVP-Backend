import express from "express";
import dotenv from 'dotenv';
import router from "./routes/walletsRoutes.js";
dotenv.config();

const port = process.env.PORT||3000;
const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));




app.use("/v1/api/wallet",router )
app.get
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  
});