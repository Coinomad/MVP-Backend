const express = require("express");
const {
  getWaitListController,
  WaitListController,
} = require("../controllers/waitListController.js");

const waitListRouter = express.Router();

waitListRouter.route("/").post(WaitListController).get(getWaitListController);

module.exports = waitListRouter;
