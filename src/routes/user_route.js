const express = require('express');
const UserController = require('../controller/user_controller');
const UserRouter = express.Router();

UserRouter.post("/add-user", UserController.addUser);
UserRouter.post("/login", UserController.loginUser);

module.exports = UserRouter;