const express = require("express");
const {
  createGroup,
  addMember,
  removeMember,
  leaveGroup,
  getGroupBalances,
  getGroups,
  deleteGroup,
  updateGroup
} = require("../controllers/groupController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();
router.delete("/:groupId/members/:userId", protect, removeMember);

router.delete("/:groupId/leave", protect, leaveGroup);

router.delete("/:groupId", protect, deleteGroup);

router.post("/", protect, createGroup);

router.post("/:groupId/members", protect, addMember);


router.put("/:groupId",protect , updateGroup);

router.get("/:groupId/balances", protect, getGroupBalances);

router.get("/", protect, getGroups);


module.exports = router;
