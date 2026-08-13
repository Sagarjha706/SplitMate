const Expense = require("../models/Expense");
const Group = require("../models/Group");

const createExpense = async (req, res) => {
    try {
        const { description, amount, paidBy, groupId, splitBetween } = req.body;

        // Check required fields
        if (!description || !amount || !paidBy || !groupId || !splitBetween) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        // Find group
        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        // Check if logged-in user is a group member
        if (!group.members.some(
            member => member.toString() === req.userId
        )) {
            return res.status(403).json({
                message: "You are not a member of this group"
            });
        }

        // Check if payer is a group member
        if (!group.members.some(
            member => member.toString() === paidBy
        )) {
            return res.status(400).json({
                message: "Payer is not a member of this group"
            });
        }

        // Check every person in split is a group member
        for (const split of splitBetween) {
            if (!group.members.some(
                member => member.toString() === split.user
            )) {
                return res.status(400).json({
                    message: "A person in the split is not a group member"
                });
            }
        }

        // Check split total
        const splitTotal = splitBetween.reduce(
            (total, split) => total + Number(split.amount),
            0
        );

        if (splitTotal !== Number(amount)) {
            return res.status(400).json({
                message: "Split amounts must equal total expense"
            });
        }

        // Create expense
        const expense = await Expense.create({
            description,
            amount,
            paidBy,
            group: groupId,
            splitBetween
        });

        res.status(201).json({
            message: "Expense created successfully",
            expense
        });

    } catch (error) {
        console.error("Create expense error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const getGroupExpenses = async (req, res) => {
    try {
        const { groupId } = req.params;

        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        // Check if logged-in user is a member
        if (!group.members.some(
            member => member.toString() === req.userId
        )) {
            return res.status(403).json({
                message: "You are not a member of this group"
            });
        }

        const expenses = await Expense.find({
            group: groupId
        })
            .populate("paidBy", "name email")
            .populate("splitBetween.user", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            expenses
        });

    } catch (error) {
        console.error("Get expenses error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;

        const expense = await Expense.findById(id);

        if (!expense) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }

        // Make sure the logged-in user is a member
        // of the group containing this expense
        const group = await Group.findById(
            expense.group
        );

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        const isMember = group.members.some(
            (memberId) =>
                memberId.toString() ===
                req.userId.toString()
        );

        if (!isMember) {
            return res.status(403).json({
                message:
                    "You are not a member of this group"
            });
        }

        await Expense.findByIdAndDelete(id);

        res.status(200).json({
            message: "Expense deleted successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to delete expense"
        });
    }
};

const updateExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            description,
            amount,
            paidBy,
            splitBetween
        } = req.body;

        const expense = await Expense.findById(id);

        if (!expense) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }

        const group = await Group.findById(
            expense.group
        );

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        const isMember = group.members.some(
            (memberId) =>
                memberId.toString() ===
                req.userId.toString()
        );

        if (!isMember) {
            return res.status(403).json({
                message:
                    "You are not a member of this group"
            });
        }

        // Validate split total
        const splitTotal = splitBetween.reduce(
            (total, split) =>
                total + Number(split.amount),
            0
        );

        if (
            Number(splitTotal.toFixed(2)) !==
            Number(Number(amount).toFixed(2))
        ) {
            return res.status(400).json({
                message:
                    "Split amounts must equal expense amount"
            });
        }

        expense.description = description;
        expense.amount = amount;
        expense.paidBy = paidBy;
        expense.splitBetween = splitBetween;

        await expense.save();

        const updatedExpense =
            await Expense.findById(expense._id)
                .populate("paidBy", "name email")
                .populate(
                    "splitBetween.user",
                    "name email"
                );

        res.status(200).json({
            message: "Expense updated successfully",
            expense: updatedExpense
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to update expense"
        });
    }
};

module.exports = {
    createExpense,
    getGroupExpenses,
    deleteExpense,
    updateExpense
};