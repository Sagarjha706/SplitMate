const express = require("express");
const {
  createExpense,
  getGroupExpenses,
  deleteExpense,
  updateExpense
} = require("../controllers/expenseController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createExpense);

router.get("/group/:groupId", protect, getGroupExpenses);

router.delete("/:id", protect, deleteExpense);

router.put(
    "/:id",
    protect,
    updateExpense
);

module.exports = router;
