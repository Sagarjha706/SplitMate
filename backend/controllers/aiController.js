const { parseExpense } = require("../services/aiService");

const parseExpenseWithAI = async (req, res) => {

    try {

        console.log("AI REQUEST BODY:", req.body);

        const { text, members } = req.body || {};

        if (!text || !text.trim()) {
            return res.status(400).json({
                message: "Expense description is required"
            });
        }

        if (!members || !Array.isArray(members)) {
            return res.status(400).json({
                message: "Group members are required"
            });
        }

        const expense = await parseExpense(
            text.trim(),
            members
        );

        res.status(200).json({
            message: "Expense parsed successfully",
            expense
        });
    }catch(error) {

    console.error(
        "AI expense parsing error:",
        error
    );

    res.status(500).json({
        message: "Failed to understand expense",
        error: error.message
    });}
};

module.exports = {
    parseExpenseWithAI
};