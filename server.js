const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.send("Backend is running.");
});

app.listen(9000, () => {
  console.log("Server running on PORT: 9000");
});
