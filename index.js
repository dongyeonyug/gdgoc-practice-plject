"use strict";
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const userRoutes = require("./routes/user-routes");
const ChatLogRoutes = require("./routes/ChatLogRoutes");
 


const app = express();
 
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
 
app.use("/api", userRoutes.routes);
app.use("/api", ChatLogRoutes.routes);
 
// app.listen(config.port, () =>
//   console.log("App is Listening on url http://localhost:" + config.port)
// );


const PORT = process.env.PORT || 8080; // Cloud Run은 기본적으로 8080 포트를 사용합니다.
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});