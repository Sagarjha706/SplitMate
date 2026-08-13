import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import API from "../services/api";
import Navbar from "../components/Navbar";
import BalanceCard from "../components/BalanceCard";
import ExpenseCard from "../components/ExpenseCard";

import "../GroupDetails.css";

const GroupDetails = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();

  // =========================
  // STATE
  // =========================

  // Edit Group

  const [editingGroup, setEditingGroup] = useState(false);

  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupDescription, setEditGroupDescription] = useState("");
  const [savingGroup, setSavingGroup] = useState(false);

  const [group, setGroup] = useState(null);
  const [balances, setBalances] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settlementHistory, setSettlementHistory] = useState([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Members
  const [memberEmail, setMemberEmail] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [removingMember, setRemovingMember] = useState(null);
  const [leavingGroup, setLeavingGroup] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);
  // Expense
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");

  // Split
  const [splitMode, setSplitMode] = useState("equal");
  const [customSplits, setCustomSplits] = useState({});

  // Settlement
  const [settlingId, setSettlingId] = useState(null);

  // AI Expense Assistant
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [aiParticipants, setAiParticipants] = useState([]);
  // =========================
  // AUTH
  // =========================

  const token = localStorage.getItem("token");

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const currentUser = JSON.parse(localStorage.getItem("user"));

  const currentUserId = currentUser?.id || currentUser?._id;

  // =========================
  // FETCH GROUP DATA
  // =========================

  const fetchGroupData = async () => {
    try {
      setError("");

      const groupsResponse = await API.get("/groups", config);

      const currentGroup = groupsResponse.data.groups.find(
        (group) => group._id === groupId,
      );

      if (!currentGroup) {
        setError("Group not found");
        return;
      }

      setGroup(currentGroup);

      // Default payer
      if (currentGroup.members.length > 0 && !paidBy) {
        setPaidBy(currentGroup.members[0]._id);
      }

      // Initialize custom splits
      const initialSplits = {};

      currentGroup.members.forEach((member) => {
        initialSplits[member._id] = "";
      });

      setCustomSplits(initialSplits);

      // Get balances
      const balanceResponse = await API.get(
        `/groups/${groupId}/balances`,
        config,
      );

      setBalances(balanceResponse.data.settlements || []);

      // Get expenses
      const expenseResponse = await API.get(
        `/expenses/group/${groupId}`,
        config,
      );

      setExpenses(expenseResponse.data.expenses || []);

      // Get settlement history
      const settlementResponse = await API.get(
        `/settlements/group/${groupId}`,
        config,
      );

      setSettlementHistory(settlementResponse.data.settlements || []);
    } catch (error) {
      console.error(error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");

        localStorage.removeItem("user");

        navigate("/login");
      } else {
        setError(error.response?.data?.message || "Failed to load group");
      }
    }
  };

  // =========================
  // INITIAL LOAD
  // =========================

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchGroupData();
  }, [groupId]);

  // =========================
  // ADD MEMBER
  // =========================

  const handleAddMember = async (e) => {
    e.preventDefault();

    setError("");

    if (!memberEmail.trim()) {
      setError("Please enter an email");
      return;
    }

    try {
      setAddingMember(true);

      await API.post(
        `/groups/${groupId}/members`,
        {
          email: memberEmail.trim(),
        },
        config,
      );

      setMemberEmail("");

      await fetchGroupData();
    } catch (error) {
      console.error(error);

      setError(error.response?.data?.message || "Failed to add member");
    } finally {
      setAddingMember(false);
    }
  };

  // =========================
  // REMOVE MEMBER
  // =========================

  const handleRemoveMember = async (userId, userName) => {
    const confirmed = window.confirm(`Remove ${userName} from this group?`);

    if (!confirmed) return;

    try {
      setRemovingMember(userId);
      setError("");

      await API.delete(`/groups/${groupId}/members/${userId}`, config);

      await fetchGroupData();
    } catch (error) {
      console.error(error);

      setError(error.response?.data?.message || "Failed to remove member");
    } finally {
      setRemovingMember(null);
    }
  };

  // =========================
  // LEAVE GROUP
  // =========================

  const handleLeaveGroup = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to leave this group?",
    );

    if (!confirmed) return;

    try {
      setLeavingGroup(true);
      setError("");

      await API.delete(`/groups/${groupId}/leave`, config);

      navigate("/dashboard");
    } catch (error) {
      console.error(error);

      setError(error.response?.data?.message || "Failed to leave group");
    } finally {
      setLeavingGroup(false);
    }
  };

  // =========================
  // CUSTOM SPLIT
  // =========================

  const handleCustomSplitChange = (userId, value) => {
    setCustomSplits((prev) => ({
      ...prev,
      [userId]: value,
    }));
  };


  // =========================
  // AI EXPENSE ASSISTANT
  // =========================

  const handleAIExpense = async () => {
    if (!aiText.trim()) {
      setAiMessage("Describe the expense first.");
      return;
    }

    try {
      setAiLoading(true);
      setAiMessage("");
      setError("");

      const response = await API.post(
        "/ai/parse-expense",
        {
          text: aiText.trim(),
          members: group.members.map((member) => ({
            name: member.name,
          })),
        },
        config,
      );

      const aiExpense = response.data.expense;

      // Find the actual group members selected by AI
      const participantIds = group.members
  .filter((member) =>
    (aiExpense.participants || []).some(
      (name) =>
        String(name).trim().toLowerCase() ===
        String(member.name).trim().toLowerCase()
    )
  )
  .map((member) => String(member._id));

console.log(
  "AI detected participants:",
  aiExpense.participants
);

console.log(
  "Participant IDs:",
  participantIds
);

setAiParticipants(participantIds);

      // Fill description
      setDescription(aiExpense.description || "");

      // Fill amount
      setAmount(
        aiExpense.amount
          ? String(aiExpense.amount)
          : "",
      );

      // Fill payer
      const payer = group.members.find(
        (member) =>
          member.name.toLowerCase() ===
          aiExpense.paidBy.toLowerCase(),
      );

      if (payer) {
        setPaidBy(payer._id);
      }

      // Set split mode
      if (aiExpense.splitType === "equal") {
        setSplitMode("equal");
      } else {
        setSplitMode("custom");

        const newSplits = {};

        group.members.forEach((member) => {
          newSplits[member._id] = "";
        });

        setCustomSplits(newSplits);
      }

      setAiMessage(
        "Expense understood! Review the details below before adding it.",
      );
    } catch (error) {
      console.error(error);

      setAiMessage(
        error.response?.data?.message ||
          "Could not understand the expense.",
      );
    } finally {
      setAiLoading(false);
    }
  };

  // =========================
  // ADD EXPENSE
  // =========================

 const handleAddExpense = async (e) => {
  e.preventDefault();

  setError("");

  if (!description.trim()) {
    setError("Please enter a description");
    return;
  }

  if (!amount) {
    setError("Please enter an amount");
    return;
  }

  const numericAmount = Number(amount);

  if (isNaN(numericAmount) || numericAmount <= 0) {
    setError("Amount must be greater than 0");
    return;
  }

  if (!paidBy) {
    setError("Please select who paid");
    return;
  }

  if (!group || group.members.length === 0) {
    setError("Group has no members");
    return;
  }

  let splitBetween = [];

  // =========================
  // EQUAL SPLIT
  // =========================

  if (splitMode === "equal") {

    let participants;

    /*
     * AI PARTICIPANTS
     *
     * If AI detected participants,
     * use ONLY those members.
     */
    if (aiParticipants.length > 0) {

      participants = group.members.filter((member) =>
        aiParticipants.some(
          (id) =>
            String(id) === String(member._id)
        )
      );

    } else {

      /*
       * Normal manual equal split
       * = everyone in the group
       */
      participants = group.members;
    }

    // Debug - temporarily keep this
    console.log(
      "AI participants:",
      aiParticipants
    );

    console.log(
      "Actual participants:",
      participants.map((member) => ({
        id: member._id,
        name: member.name
      }))
    );

    if (participants.length === 0) {
      setError("Please select at least one participant");
      return;
    }

    // =========================
    // CALCULATE SPLIT
    // =========================

    const splitAmount =
      numericAmount / participants.length;

    splitBetween = participants.map((member) => ({
      user: member._id,
      amount: Number(
        splitAmount.toFixed(2)
      ),
    }));

    // =========================
    // FIX ROUNDING
    // =========================

    const splitTotal =
      splitBetween.reduce(
        (total, split) =>
          total + split.amount,
        0
      );

    const difference = Number(
      (
        numericAmount -
        splitTotal
      ).toFixed(2)
    );

    if (difference !== 0) {
      splitBetween[
        splitBetween.length - 1
      ].amount += difference;
    }

  }

  // =========================
  // CUSTOM SPLIT
  // =========================

  else {

    splitBetween =
      group.members.map((member) => ({
        user: member._id,
        amount: Number(
          customSplits[member._id] || 0
        ),
      }));

    const hasNegative =
      splitBetween.some(
        (split) =>
          split.amount < 0
      );

    if (hasNegative) {
      setError(
        "Split amount cannot be negative"
      );
      return;
    }

    const customTotal =
      splitBetween.reduce(
        (total, split) =>
          total + split.amount,
        0
      );

    if (
      Number(customTotal.toFixed(2)) !==
      Number(numericAmount.toFixed(2))
    ) {
      setError(
        `Custom split must equal ₹${numericAmount}. Current split: ₹${customTotal}`
      );
      return;
    }
  }

  // =========================
  // SEND EXPENSE
  // =========================

  try {

    setLoading(true);

    console.log(
      "FINAL SPLIT SENT TO BACKEND:",
      splitBetween
    );

    await API.post(
      "/expenses",
      {
        description:
          description.trim(),

        amount:
          numericAmount,

        paidBy,

        groupId,

        splitBetween,
      },
      config
    );

    // =========================
    // RESET FORM
    // =========================

    setDescription("");
    setAmount("");

    setAiText("");
    setAiMessage("");
    setAiParticipants([]);

    const resetSplits = {};

    group.members.forEach(
      (member) => {
        resetSplits[
          member._id
        ] = "";
      }
    );

    setCustomSplits(
      resetSplits
    );

    await fetchGroupData();

  } catch (error) {

    console.error(error);

    setError(
      error.response?.data?.message ||
      "Failed to create expense"
    );

  } finally {

    setLoading(false);

  }
};

  // =========================
  // EXPENSE DELETED / UPDATED
  // =========================

  const handleExpenseChanged = async () => {
    await fetchGroupData();
  };

  // =========================
  // SETTLE BALANCE
  // =========================

  const handleSettle = async (balance) => {
    try {
      setError("");

      setSettlingId(balance.from.id);

      await API.post(
        "/settlements",
        {
          groupId,

          to: balance.to.id,

          amount: balance.amount,
        },
        config,
      );

      await fetchGroupData();
    } catch (error) {
      console.error(error);

      setError(error.response?.data?.message || "Failed to settle balance");
    } finally {
      setSettlingId(null);
    }
  };

  // =========================
  // DELETE GROUP
  // =========================

  const handleDeleteGroup = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${group.name}"?\n\n` +
        "This will permanently delete the group, " +
        "all expenses, and all settlement history.",
    );

    if (!confirmed) return;

    try {
      setDeletingGroup(true);
      setError("");

      await API.delete(`/groups/${groupId}`, config);

      navigate("/dashboard");
    } catch (error) {
      console.error(error);

      setError(error.response?.data?.message || "Failed to delete group");
    } finally {
      setDeletingGroup(false);
    }
  };

  const handleUpdateGroup = async () => {
    if (!editGroupName.trim()) {
      setError("Group name is required");
      return;
    }

    try {
      setSavingGroup(true);
      setError("");

      const response = await API.put(
        `/groups/${groupId}`,
        {
          name: editGroupName.trim(),
          description: editGroupDescription.trim(),
        },
        config,
      );

      // Update group immediately in frontend
      setGroup((prev) => ({
        ...prev,
        name: response.data.group.name,
        description: response.data.group.description,
      }));

      setEditingGroup(false);
    } catch (error) {
      console.error(error);

      setError(error.response?.data?.message || "Failed to update group");
    } finally {
      setSavingGroup(false);
    }
  };

  // =========================
  // LOADING
  // =========================

  if (!group && !error) {
    return (
      <>
        <Navbar />

        <main className="group-page">
          <div className="container py-5">
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>

              <p className="mt-3 text-muted">Loading group...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  // =========================
  // ERROR
  // =========================

  if (!group && error) {
    return (
      <>
        <Navbar />

        <main className="group-page">
          <div className="container py-5">
            <div className="alert alert-danger">{error}</div>

            <button
              className="btn btn-primary"
              onClick={() => navigate("/dashboard")}
            >
              ← Back to Dashboard
            </button>
          </div>
        </main>
      </>
    );
  }

  // =========================
  // UI
  // =========================

  return (
    <div className="group-page">
      <Navbar />

      <main className="container py-4">
        {/* =========================
                    BACK
                ========================= */}

        <div className="mb-3">
          <button
            className="btn btn-light border shadow-sm"
            onClick={() => navigate("/dashboard")}
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* =========================
                    GROUP HEADER
                ========================= */}

        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body text-center py-4">
            <div className="group-title-row">
              <div>
                <h1 className="mb-4">{group.name}</h1>

                <p className="text-muted mb-0">
                  {group.description || "No description added"}
                </p>
              </div>

              {group.createdBy?._id === currentUserId && (
                <button
                  type="button"
                  className="edit-group-btn"
                  onClick={() => {
                    setEditGroupName(group.name);
                    setEditGroupDescription(group.description || "");
                    setEditingGroup(true);
                  }}
                >
                  ✏️ Edit Group
                </button>
              )}
            </div>
          </div>
        </div>

        {/* =========================
                    ERROR
                ========================= */}

        {error && <div className="alert alert-danger">{error}</div>}

        {/* =========================
                    MEMBERS
                ========================= */}

        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h4 mb-0">Members</h2>

              <span className="badge text-bg-primary">
                {group.members.length} members
              </span>
            </div>

            {/* MEMBER PILLS */}

            <div className="d-flex flex-wrap gap-2 mb-4">
              {group.members.map((member) => {
                const isCreator = group.createdBy?._id === member._id;

                return (
                  <div key={member._id} className="member-pill">
                    <span>
                      {member.name}

                      {isCreator && <span className="ms-1">👑</span>}
                    </span>

                    {group.createdBy?._id === currentUserId && !isCreator && (
                      <button
                        className="btn btn-sm btn-outline-danger member-delete-btn"
                        onClick={() =>
                          handleRemoveMember(member._id, member.name)
                        }
                        disabled={removingMember === member._id}
                        title={`Remove ${member.name}`}
                      >
                        {removingMember === member._id ? (
                          <span
                            className="spinner-border spinner-border-sm"
                            role="status"
                          />
                        ) : (
                          "🗑️"
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ADD MEMBER */}

            <form onSubmit={handleAddMember}>
              <div className="input-group">
                <input
                  type="email"
                  className="form-control"
                  placeholder="Enter member email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                />

                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={addingMember}
                >
                  {addingMember ? "Adding..." : "Add Member"}
                </button>
              </div>
            </form>

            {/* LEAVE */}

            {group.createdBy?._id !== currentUserId && (
              <div className="mt-3">
                <button
                  className="btn btn-outline-danger"
                  onClick={handleLeaveGroup}
                  disabled={leavingGroup}
                >
                  {leavingGroup ? "Leaving..." : "Leave Group"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* DELETE GROUP */}

        {group.createdBy?._id === currentUserId && (
          <div className="mt-3">
            <button
              className="btn btn-danger   mb-4"
              onClick={handleDeleteGroup}
              disabled={deletingGroup}
            >
              {deletingGroup ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  />
                  Deleting...
                </>
              ) : (
                <>🗑️ Delete Group</>
              )}
            </button>
          </div>
        )}

        {/* =========================
                    BALANCES
                ========================= */}

        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h4 mb-0">Balances</h2>

              {balances.length === 0 && (
                <span className="badge text-bg-success">Settled</span>
              )}
            </div>

            {balances.length === 0 ? (
              <div className="text-center py-4">
                <div className="settled-icon">✓</div>

                <p className="text-muted mb-0">Everyone is settled up! 🎉</p>
              </div>
            ) : (
              <div className="balance-list">
                {balances.map((balance, index) => (
                  <BalanceCard
                    key={index}
                    balance={balance}
                    currentUserId={currentUserId}
                    onSettle={handleSettle}
                    settling={settlingId === balance.from.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* =========================
                    ADD EXPENSE
                ========================= */}

        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="expense-form-header">
              <div>
                <h2 className="h4 mb-1">Add Expense</h2>

                <p className="text-muted mb-0">
                  Record an expense and split it with your group.
                </p>
              <div className="ai-expense-box">

    <div className="ai-expense-header">

        <div>
            <h3>
                ✨ Add with AI
            </h3>

            <p>
                Describe your expense naturally and
                we'll fill the form for you.
            </p>
        </div>

        <span className="ai-badge">
            AI
        </span>

    </div>


    <div className="ai-expense-input-row">

        <textarea
            className="form-control"
            rows="2"
            placeholder='e.g. "Sagar paid ₹1200 for dinner, split equally between Sagar and Rahul"'
            value={aiText}
            onChange={(e) =>
                setAiText(e.target.value)
            }
        />

        <button
            type="button"
            className="ai-expense-btn"
            onClick={handleAIExpense}
            disabled={aiLoading}
        >

            {aiLoading ? (
                <>
                    <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                    />

                    Understanding...
                </>
            ) : (
                <>
                    ✨ Understand
                </>
            )}

        </button>

    </div>


    {aiMessage && (
        <div className="ai-expense-message">
            {aiMessage}
        </div>
    )}

</div>

              </div>

              <span className="expense-form-icon">₹</span>
            </div>

            <form onSubmit={handleAddExpense}>
              <div className="row g-3">
                {/* DESCRIPTION */}

                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    What was the expense?
                  </label>

                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="e.g. Dinner, Hotel, Cab"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* AMOUNT */}

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Amount</label>

                  <div className="input-group input-group-lg">
                    <span className="input-group-text">₹</span>

                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      step="0.01"
                      placeholder="500"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>

                {/* PAID BY */}

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Who paid?</label>

                  <select
                    className="form-select form-select-lg"
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                  >
                    {group.members.map((member) => (
                      <option key={member._id} value={member._id}>
                        {member.name}
                        {member._id === currentUserId ? " (You)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SPLIT TYPE */}

                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    How should it be split?
                  </label>

                  <div className="split-options">
                    <button
                      type="button"
                      className={`split-option ${
                        splitMode === "equal" ? "active" : ""
                      }`}
                      onClick={() => {
                        setSplitMode("equal");
                        setAiParticipants([]);
                      }}
                    >
                      <span className="split-option-icon">=</span>

                      <span>
                        <strong>Equally</strong>

                        <small>Split evenly</small>
                      </span>
                    </button>

                    <button
                      type="button"
                      className={`split-option ${
                        splitMode === "custom" ? "active" : ""
                      }`}
                      onClick={() => {
                        setSplitMode("custom");
                        setAiParticipants([]);
                      }}
                    >
                      <span className="split-option-icon">%</span>

                      <span>
                        <strong>Custom</strong>

                        <small>Choose each share</small>
                      </span>
                    </button>
                  </div>
                </div>

                {/* EQUAL SPLIT INFO */}

                {splitMode === "equal" && (
                  <div className="col-12">
                    <div className="equal-split-preview">
                      <div className="equal-split-icon">✓</div>

                      <div>
                        <strong>Equal split</strong>

                        <p>
                          This expense will be divided equally between{" "}
                          <strong>
                            {aiParticipants.length > 0
                              ? aiParticipants.length
                              : group.members.length}
                          </strong>{" "}
                          {aiParticipants.length === 1
                            ? "person"
                            : "people"}.
                        </p>

                        {aiParticipants.length > 0 && (
                          <div className="mt-2">
                            <small className="text-muted d-block mb-1">
                              AI detected these participants:
                            </small>

                            <div className="d-flex flex-wrap gap-2">
                              {group.members
                                .filter((member) =>
                                  aiParticipants.includes(member._id),
                                )
                                .map((member) => (
                                  <span
                                    key={member._id}
                                    className="badge text-bg-primary"
                                  >
                                    {member.name}
                                  </span>
                                ))}
                            </div>
                          </div>
                        )}

                        {amount && Number(amount) > 0 && (
                          <div className="split-preview-amount">
                            Each person pays{" "}
                            <strong>
                              ₹
                              {(
                                Number(amount) /
                                (aiParticipants.length > 0
                                  ? aiParticipants.length
                                  : group.members.length)
                              ).toFixed(2)}
                            </strong>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* CUSTOM SPLIT */}

                {splitMode === "custom" && (
                  <div className="col-12">
                    <div className="custom-split-box">
                      <div className="custom-split-header">
                        <div>
                          <h3 className="h6 mb-1">Custom Split</h3>

                          <p className="text-muted mb-0">
                            Enter how much each person should pay.
                          </p>
                        </div>

                        {amount && (
                          <span className="custom-total-target">
                            Total: ₹{Number(amount).toFixed(2)}
                          </span>
                        )}
                      </div>

                      <div className="row g-3 mt-1">
                        {group.members.map((member) => (
                          <div className="col-md-6" key={member._id}>
                            <label className="form-label">
                              {member.name}
                              {member._id === currentUserId ? " (You)" : ""}
                            </label>

                            <div className="input-group">
                              <span className="input-group-text">₹</span>

                              <input
                                type="number"
                                className="form-control"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={customSplits[member._id] || ""}
                                onChange={(e) =>
                                  handleCustomSplitChange(
                                    member._id,
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {amount && (
                        <div className="custom-split-total">
                          <span>Split total</span>

                          <strong>
                            ₹
                            {group.members
                              .reduce(
                                (total, member) =>
                                  total + Number(customSplits[member._id] || 0),
                                0,
                              )
                              .toFixed(2)}
                            {" / "}₹{Number(amount).toFixed(2)}
                          </strong>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SUBMIT */}

                <div className="col-12">
                  <button
                    className="add-expense-btn"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                        />
                        Adding Expense...
                      </>
                    ) : (
                      <>
                        <span className="me-2">+</span>
                        Add Expense
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* =========================
                    EXPENSES
                ========================= */}

        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h4 mb-0">Expenses</h2>

              <span className="badge text-bg-secondary">{expenses.length}</span>
            </div>

            {expenses.length === 0 ? (
              <div className="empty-section">
                <p className="text-muted mb-0">No expenses yet.</p>
              </div>
            ) : (
              expenses.map((expense) => (
                <ExpenseCard
                  key={expense._id}
                  expense={expense}
                  onDelete={handleExpenseChanged}
                  onUpdate={handleExpenseChanged}
                />
              ))
            )}
          </div>
        </div>

        {/* =========================
                    SETTLEMENT HISTORY
                ========================= */}

        <div className="card border-0 shadow-sm mb-5">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h4 mb-0">Settlement History</h2>

              <span className="badge text-bg-secondary">
                {settlementHistory.length}
              </span>
            </div>

            {settlementHistory.length === 0 ? (
              <div className="empty-section">
                <p className="text-muted mb-0">No settlements yet.</p>
              </div>
            ) : (
              <div>
                {settlementHistory.map((settlement) => (
                  <div className="settlement-item" key={settlement._id}>
                    <div>
                      <div className="settlement-payment">
                        <strong>{settlement.from.name}</strong>

                        <span className="settlement-arrow">→</span>

                        <strong>{settlement.to.name}</strong>
                      </div>

                      <small className="text-muted">
                        {new Date(settlement.createdAt).toLocaleString()}
                      </small>
                    </div>

                    <strong className="text-success">
                      ₹{Number(settlement.amount).toFixed(2)}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      {editingGroup && (
        <div className="edit-group-overlay">
          <div className="edit-group-modal">
            <div className="edit-group-modal-header">
              <div>
                <h2>Edit Group</h2>

                <p>Update your group's information.</p>
              </div>

              <button
                type="button"
                className="edit-group-close"
                onClick={() => setEditingGroup(false)}
              >
                ×
              </button>
            </div>

            <div className="edit-group-form">
              <div className="edit-group-field">
                <label>Group Name</label>

                <input
                  type="text"
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  placeholder="Group name"
                />
              </div>

              <div className="edit-group-field">
                <label>Description</label>

                <textarea
                  rows="4"
                  value={editGroupDescription}
                  onChange={(e) => setEditGroupDescription(e.target.value)}
                  placeholder="Group description"
                />
              </div>

              <div className="edit-group-actions">
                <button
                  type="button"
                  className="edit-group-cancel"
                  onClick={() => setEditingGroup(false)}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="edit-group-save"
                  onClick={handleUpdateGroup}
                  disabled={savingGroup}
                >
                  {savingGroup ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetails;