const express = require("express");
const {addChat,
  getAllChats,
  addLog,
  getAllLogs,deleteChat} = require("../controllers/ChatsLogsController");
 
const router = express.Router();
 
router.post("/chat", addChat);
router.get("/chats", getAllChats);
router.post("/log", addLog);
router.get("/logs", getAllLogs);
// :id 부분은 프론트엔드에서 보내주는 문서 ID가 들어가는 자리입니다.
router.delete('/chats/:id', deleteChat);



module.exports = {
  routes: router
};