const express = require("express");
const router = express.Router();

// Example route (for debugging)
router.get("/test", (req, res) => {
  res.json({ message: "Signaling service is up!" });
});
// router.post("/update-socket");

module.exports = router;