import express from "express";
import {
  getWaitListController,
  WaitListController,
} from "../controllers/waitListController.js";

const waitListRouter = express.Router();
waitListRouter.route("/").post(WaitListController).get(getWaitListController);
export default waitListRouter;
