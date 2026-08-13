const express = require("express");
const {
  createSettlement,
  getSettlementHistory,
} = require("../controllers/settlementController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createSettlement);
router.get("/group/:groupId", protect, getSettlementHistory);

module.exports = router;
