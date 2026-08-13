const Group = require("../models/Group");
const User = require("../models/User");
const Expense = require("../models/Expense");
const Settlement = require("../models/Settlement");

const createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Group name is required",
      });
    }

    const group = await Group.create({
      name,
      description,
      createdBy: req.userId,
      members: [req.userId],
    });

    res.status(201).json({
      message: "Group created successfully",
      group,
    });
  } catch (error) {
    console.error("Create group error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const addMember = async (req, res) => {
  try {
    const { email } = req.body;
    const { groupId } = req.params;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    // Find group
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found",
      });
    }

    // Only group members can add members
    if (!group.members.some((member) => member.toString() === req.userId)) {
      return res.status(403).json({
        message: "You are not a member of this group",
      });
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Check if already a member
    if (
      group.members.some((member) => member.toString() === user._id.toString())
    ) {
      return res.status(400).json({
        message: "User is already a member",
      });
    }

    // Add member
    group.members.push(user._id);

    await group.save();

    res.status(200).json({
      message: "Member added successfully",
      group,
    });
  } catch (error) {
    console.error("Add member error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getGroupBalances = async (req, res) => {
    try {
        const { groupId } = req.params;

        // Find group
        const group = await Group.findById(groupId)
            .populate("members", "name email");

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        // Check if logged-in user is a member
        const isMember = group.members.some(
            member => member._id.toString() === req.userId
        );

        if (!isMember) {
            return res.status(403).json({
                message: "You are not a member of this group"
            });
        }

        // Get expenses
        const expenses = await Expense.find({
            group: groupId
        });

        // Get settlements
        const settlements = await Settlement.find({
            group: groupId
        });

        // Store net balances
        const balances = {};

        // Initialize all members
        group.members.forEach(member => {
            balances[member._id.toString()] = 0;
        });

        // --------------------------------
        // 1. Calculate expense balances
        // --------------------------------

        expenses.forEach(expense => {
            const payerId = expense.paidBy.toString();

            // Payer gets credit
            balances[payerId] += Number(expense.amount);

            // Split amounts are debts
            expense.splitBetween.forEach(split => {
                const userId = split.user.toString();

                if (balances[userId] !== undefined) {
                    balances[userId] -= Number(split.amount);
                }
            });
        });

        // --------------------------------
        // 2. Apply settlements
        // --------------------------------

        settlements.forEach(settlement => {
            const fromId = settlement.from.toString();
            const toId = settlement.to.toString();
            const amount = Number(settlement.amount);

            // Person who paid gets credit
            balances[fromId] += amount;

            // Person who received gets debited
            balances[toId] -= amount;
        });

        // --------------------------------
        // 3. Separate creditors/debtors
        // --------------------------------

        const creditors = [];
        const debtors = [];

        group.members.forEach(member => {
            const userId = member._id.toString();
            const balance = balances[userId];

            if (balance > 0.01) {
                creditors.push({
                    user: member,
                    amount: balance
                });
            }

            if (balance < -0.01) {
                debtors.push({
                    user: member,
                    amount: Math.abs(balance)
                });
            }
        });

        // --------------------------------
        // 4. Simplify debts
        // --------------------------------

        const simplifiedSettlements = [];

        let debtorIndex = 0;
        let creditorIndex = 0;

        while (
            debtorIndex < debtors.length &&
            creditorIndex < creditors.length
        ) {
            const debtor = debtors[debtorIndex];
            const creditor = creditors[creditorIndex];

            const amount = Math.min(
                debtor.amount,
                creditor.amount
            );

            simplifiedSettlements.push({
                from: {
                    id: debtor.user._id,
                    name: debtor.user.name,
                    email: debtor.user.email
                },

                to: {
                    id: creditor.user._id,
                    name: creditor.user.name,
                    email: creditor.user.email
                },

                amount: Number(amount.toFixed(2))
            });

            debtor.amount -= amount;
            creditor.amount -= amount;

            if (debtor.amount <= 0.01) {
                debtorIndex++;
            }

            if (creditor.amount <= 0.01) {
                creditorIndex++;
            }
        }

        res.status(200).json({
            group: {
                id: group._id,
                name: group.name
            },
            settlements: simplifiedSettlements
        });

    } catch (error) {
        console.error("Balance calculation error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const getGroups = async (req, res) => {
    try {
        const groups = await Group.find({
            members: req.userId
        })
            .populate("members", "name email")
            .populate("createdBy", "name email");

        res.status(200).json({
            groups
        });

    } catch (error) {
        console.error("Get groups error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const removeMember = async (req, res) => {
    try {
        const { groupId, userId } = req.params;

        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        // Only the group creator can remove another member
        if (
            group.createdBy.toString() !==
            req.userId.toString()
        ) {
            return res.status(403).json({
                message:
                    "Only the group creator can remove members"
            });
        }

        // Cannot remove the creator
        if (
            group.createdBy.toString() ===
            userId.toString()
        ) {
            return res.status(400).json({
                message:
                    "Group creator cannot be removed"
            });
        }

        // Check member exists
        const isMember = group.members.some(
            (member) =>
                member.toString() === userId.toString()
        );

        if (!isMember) {
            return res.status(404).json({
                message:
                    "User is not a member of this group"
            });
        }

        // Get current balances
        const expenses = await Expense.find({
            group: groupId
        });

        const settlements = await Settlement.find({
            group: groupId
        });

        let balance = 0;

        // Calculate this user's balance
        expenses.forEach((expense) => {

            const payerId =
                expense.paidBy.toString();

            if (payerId === userId.toString()) {
                balance += Number(
                    expense.amount
                );
            }

            expense.splitBetween.forEach(
                (split) => {

                    if (
                        split.user.toString() ===
                        userId.toString()
                    ) {
                        balance -= Number(
                            split.amount
                        );
                    }

                }
            );
        });

        // Apply settlements
        settlements.forEach((settlement) => {

            if (
                settlement.from.toString() ===
                userId.toString()
            ) {
                balance += Number(
                    settlement.amount
                );
            }

            if (
                settlement.to.toString() ===
                userId.toString()
            ) {
                balance -= Number(
                    settlement.amount
                );
            }

        });

        // User still owes/is owed money
        if (Math.abs(balance) > 0.01) {
            return res.status(400).json({
                message:
                    "Cannot remove member while they have an outstanding balance",
                balance: Number(
                    balance.toFixed(2)
                )
            });
        }

        // Remove member
        group.members =
            group.members.filter(
                (member) =>
                    member.toString() !==
                    userId.toString()
            );

        await group.save();

        res.status(200).json({
            message:
                "Member removed successfully",
            group
        });

    } catch (error) {

        console.error(
            "Remove member error:",
            error
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


const leaveGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.userId;

        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        // Creator cannot leave
        if (
            group.createdBy.toString() ===
            userId.toString()
        ) {
            return res.status(400).json({
                message:
                    "Group creator cannot leave the group"
            });
        }

        // Check membership
        const isMember = group.members.some(
            (member) =>
                member.toString() ===
                userId.toString()
        );

        if (!isMember) {
            return res.status(400).json({
                message:
                    "You are not a member of this group"
            });
        }

        // Calculate user's balance
        const expenses = await Expense.find({
            group: groupId
        });

        const settlements = await Settlement.find({
            group: groupId
        });

        let balance = 0;

        expenses.forEach((expense) => {

            if (
                expense.paidBy.toString() ===
                userId.toString()
            ) {
                balance += Number(
                    expense.amount
                );
            }

            expense.splitBetween.forEach(
                (split) => {

                    if (
                        split.user.toString() ===
                        userId.toString()
                    ) {
                        balance -= Number(
                            split.amount
                        );
                    }

                }
            );
        });

        settlements.forEach((settlement) => {

            if (
                settlement.from.toString() ===
                userId.toString()
            ) {
                balance += Number(
                    settlement.amount
                );
            }

            if (
                settlement.to.toString() ===
                userId.toString()
            ) {
                balance -= Number(
                    settlement.amount
                );
            }

        });

        if (Math.abs(balance) > 0.01) {
            return res.status(400).json({
                message:
                    "You cannot leave while you have an outstanding balance",
                balance: Number(
                    balance.toFixed(2)
                )
            });
        }

        // Remove current user
        group.members =
            group.members.filter(
                (member) =>
                    member.toString() !==
                    userId.toString()
            );

        await group.save();

        res.status(200).json({
            message:
                "You left the group successfully"
        });

    } catch (error) {

        console.error(
            "Leave group error:",
            error
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};

const deleteGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.userId;

        // Find group
        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        // Only creator can delete the group
        if (
            group.createdBy.toString() !==
            userId.toString()
        ) {
            return res.status(403).json({
                message:
                    "Only the group creator can delete the group"
            });
        }

        // Delete all expenses belonging to this group
        await Expense.deleteMany({
            group: groupId
        });

        // Delete all settlements belonging to this group
        await Settlement.deleteMany({
            group: groupId
        });

        // Finally delete the group
        await Group.findByIdAndDelete(groupId);

        res.status(200).json({
            message: "Group deleted successfully"
        });

    } catch (error) {

        console.error(
            "Delete group error:",
            error
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};

const updateGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { name, description } = req.body;

        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        // Only creator can edit
        if (
            group.createdBy.toString() !==
            req.userId.toString()
        ) {
            return res.status(403).json({
                message:
                    "Only the group creator can edit the group"
            });
        }

        // Validate name
        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Group name is required"
            });
        }

        group.name = name.trim();
        group.description =
            description?.trim() || "";

        await group.save();

        res.status(200).json({
            message: "Group updated successfully",
            group
        });

    } catch (error) {

        console.error(
            "Update group error:",
            error
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};  

module.exports = {
  createGroup,
  addMember,
  getGroupBalances,
  getGroups,
  removeMember,
  leaveGroup,
  deleteGroup,
  updateGroup
};
