const express = require("express");
const { addUser , getAllUser,updateUser, deleteUser} = require("../controllers/userController");
 
const router = express.Router();
 
router.post("/user", addUser);
router.get("/users", getAllUser);
router.post("/updateUser/:id", updateUser);
router.get("/deleteUser/:id", deleteUser);

module.exports = {
  routes: router
};