const Settlement = require("../models/Settlement");
const Group = require("../models/Group");

const createSettlement = async (req, res) => {
    try {
        const { groupId, to, amount } = req.body;

        if (!groupId || !to || !amount) {
            return res.status(400).json({
                message: "Group, receiver and amount are required"
            });
        }

        // Find group
        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        // Check if payer is a member
        if (!group.members.some(
            member => member.toString() === req.userId
        )) {
            return res.status(403).json({
                message: "You are not a member of this group"
            });
        }

        // Check if receiver is a member
        if (!group.members.some(
            member => member.toString() === to
        )) {
            return res.status(400).json({
                message: "Receiver is not a member of this group"
            });
        }

        // Prevent paying yourself
        if (req.userId === to) {
            return res.status(400).json({
                message: "You cannot settle with yourself"
            });
        }

        // Create settlement
        const settlement = await Settlement.create({
            group: groupId,
            from: req.userId,
            to,
            amount: Number(amount)
        });

        res.status(201).json({
            message: "Settlement recorded successfully",
            settlement
        });

    } catch (error) {
        console.error("Create settlement error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


const getSettlementHistory = async (req, res) => {
    try {
        const { groupId } = req.params;

        const settlements = await Settlement.find({
            group: groupId
        })
            .populate("from", "name email")
            .populate("to", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            settlements
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch settlement history"
        });
    }
};

module.exports = {
    createSettlement,
    getSettlementHistory
};