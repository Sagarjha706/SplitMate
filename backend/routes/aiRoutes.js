const express = require("express");

const {
    parseExpenseWithAI
} = require("../controllers/aiController");

const protect =
    require("../middleware/authMiddleware");

const router = express.Router();

router.post(
    "/parse-expense",
    protect,
    parseExpenseWithAI
);

module.exports = router;