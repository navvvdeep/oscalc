require('dotenv').config();
const express = require("express");
const cors = require("cors");
const speakeasy = require("speakeasy");

const app = express();
app.use(cors());
app.use(express.json());

const SECRET = process.env.SECRET;

app.post("/verify", (req, res) => {
  const token = req.body.token;
  if (!token) return res.send("Token is required.");
  const verified = speakeasy.totp.verify({
    secret: SECRET,
    encoding: 'base32',
    token,
    window: 1
  });
  if (verified) {
    return res.send("OK");
  } else {
    return res.send("Invalid code. Try again.");
  }
});

app.listen(9000, () => {
  console.log("TOTP Authenticator running on PORT: 9000");
});