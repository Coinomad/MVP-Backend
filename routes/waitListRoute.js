import express from "express";
import { WaitListController } from "../controllers/waitListController.js";

const waitListRouter = express.Router();
waitListRouter.post("/", WaitListController);
export default waitListRouter;
