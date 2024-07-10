import express from "express";
import { WaitListController, getWaitlistUsers } from "../controllers/waitListController.js";

const waitListRouter = express.Router();
waitListRouter.post("/", WaitListController);
waitListRouter.get("/", getWaitlistUsers);
export default waitListRouter;

