import { useState } from "react";
import API from "../services/api";
import "../ExpenseCard.css";
const ExpenseCard = ({
    expense,
    onDelete,
    onUpdate
}) => {

    const [deleting, setDeleting] = useState(false);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Edit form
    const [description, setDescription] = useState(
        expense.description
    );

    const [amount, setAmount] = useState(
        expense.amount
    );

    const [paidBy, setPaidBy] = useState(
        expense.paidBy._id
    );

    const [splitMode, setSplitMode] =
        useState("custom");

    const [splits, setSplits] = useState(() => {

        const initial = {};

        expense.splitBetween.forEach((split) => {
            initial[split.user._id] = split.amount;
        });

        return initial;
    });

    // =========================
    // DELETE
    // =========================

    const handleDelete = async () => {

        const confirmed = window.confirm(
            `Delete "${expense.description}" expense of ₹${expense.amount}?`
        );

        if (!confirmed) return;

        try {

            setDeleting(true);

            const token =
                localStorage.getItem("token");

            await API.delete(
                `/expenses/${expense._id}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            onDelete(expense._id);

        } catch (error) {

            console.error(error);

            alert(
                error.response?.data?.message ||
                "Failed to delete expense"
            );

        } finally {

            setDeleting(false);

        }
    };

    // =========================
    // SPLIT CHANGE
    // =========================

    const handleSplitChange = (
        userId,
        value
    ) => {

        setSplits((prev) => ({
            ...prev,
            [userId]: value
        }));

    };

    // =========================
    // UPDATE
    // =========================

    const handleUpdate = async (e) => {

        e.preventDefault();

        const numericAmount =
            Number(amount);

        if (
            !description.trim() ||
            numericAmount <= 0
        ) {

            alert(
                "Please enter a valid description and amount."
            );

            return;
        }

        let splitBetween = [];

        // =========================
        // EQUAL SPLIT
        // =========================

        if (splitMode === "equal") {

            const memberCount =
                expense.splitBetween.length;

            const splitAmount =
                numericAmount /
                memberCount;

            splitBetween =
                expense.splitBetween.map(
                    (split) => ({
                        user:
                            split.user._id,
                        amount:
                            Number(
                                splitAmount.toFixed(
                                    2
                                )
                            )
                    })
                );

            // Fix rounding
            const total =
                splitBetween.reduce(
                    (sum, split) =>
                        sum + split.amount,
                    0
                );

            const difference =
                Number(
                    (
                        numericAmount -
                        total
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
                expense.splitBetween.map(
                    (split) => ({
                        user:
                            split.user._id,
                        amount:
                            Number(
                                splits[
                                    split.user._id
                                ] || 0
                            )
                    })
                );

            const splitTotal =
                splitBetween.reduce(
                    (sum, split) =>
                        sum + split.amount,
                    0
                );

            if (
                Number(
                    splitTotal.toFixed(2)
                ) !==
                Number(
                    numericAmount.toFixed(2)
                )
            ) {

                alert(
                    `Split total must equal ₹${numericAmount}. Current total: ₹${splitTotal}`
                );

                return;
            }
        }

        // =========================
        // API REQUEST
        // =========================

        try {

            setSaving(true);

            const token =
                localStorage.getItem("token");

            await API.put(
                `/expenses/${expense._id}`,
                {
                    description:
                        description.trim(),

                    amount:
                        numericAmount,

                    paidBy,

                    splitBetween
                },
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            setEditing(false);

            // Tell GroupDetails to refresh
            if (onUpdate) {
                await onUpdate();
            }

        } catch (error) {

            console.error(error);

            alert(
                error.response?.data?.message ||
                "Failed to update expense"
            );

        } finally {

            setSaving(false);

        }
    };

    // =========================
    // EDIT MODE
    // =========================

    if (editing) {
    return (
        <div className="expense-edit-card">

            <h3 className="expense-edit-title">
                Edit Expense
            </h3>

            <form
                onSubmit={handleUpdate}
                className="expense-edit-form"
            >

                {/* DESCRIPTION */}

                <div className="expense-form-group">

                    <label>
                        Description
                    </label>

                    <input
                        className="expense-form-input"
                        type="text"
                        value={description}
                        onChange={(e) =>
                            setDescription(
                                e.target.value
                            )
                        }
                    />

                </div>


                {/* AMOUNT */}

                <div className="expense-form-group">

                    <label>
                        Amount
                    </label>

                    <input
                        className="expense-form-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={(e) =>
                            setAmount(
                                e.target.value
                            )
                        }
                    />

                </div>


                {/* PAID BY */}

                <div className="expense-form-group">

                    <label>
                        Paid By
                    </label>

                    <select
                        className="expense-form-select"
                        value={paidBy}
                        onChange={(e) =>
                            setPaidBy(
                                e.target.value
                            )
                        }
                    >

                        {expense.splitBetween.map(
                            (split) => (

                                <option
                                    key={
                                        split.user._id
                                    }
                                    value={
                                        split.user._id
                                    }
                                >
                                    {split.user.name}
                                </option>

                            )
                        )}

                    </select>

                </div>


                {/* SPLIT TYPE */}

                <div className="expense-form-group">

                    <label>
                        Split Type
                    </label>

                    <div className="expense-split-type">

                        <label className="expense-radio">

                            <input
                                type="radio"
                                name={`split-${expense._id}`}
                                checked={
                                    splitMode ===
                                    "equal"
                                }
                                onChange={() =>
                                    setSplitMode(
                                        "equal"
                                    )
                                }
                            />

                            Equally

                        </label>


                        <label className="expense-radio">

                            <input
                                type="radio"
                                name={`split-${expense._id}`}
                                checked={
                                    splitMode ===
                                    "custom"
                                }
                                onChange={() =>
                                    setSplitMode(
                                        "custom"
                                    )
                                }
                            />

                            Custom

                        </label>

                    </div>

                </div>


                {/* CUSTOM SPLIT */}

                {splitMode === "custom" && (

                    <div className="expense-custom-split">

                        {expense.splitBetween.map(
                            (split) => (

                                <div
                                    className="expense-custom-user"
                                    key={
                                        split.user._id
                                    }
                                >

                                    <label>
                                        {
                                            split.user.name
                                        }
                                    </label>

                                    <input
                                        className="expense-form-input"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={
                                            splits[
                                                split.user._id
                                            ] ?? ""
                                        }
                                        onChange={(e) =>
                                            handleSplitChange(
                                                split.user._id,
                                                e.target.value
                                            )
                                        }
                                    />

                                </div>

                            )
                        )}

                    </div>

                )}


                {/* BUTTONS */}

                <div className="expense-edit-actions">

                    <button
                        type="submit"
                        className="expense-save-btn"
                        disabled={saving}
                    >
                        {saving
                            ? "Saving..."
                            : "Save Changes"}
                    </button>


                    <button
                        type="button"
                        className="expense-cancel-btn"
                        onClick={() =>
                            setEditing(false)
                        }
                    >
                        Cancel
                    </button>

                </div>

            </form>

        </div>
    );
}


    // =========================
// NORMAL VIEW
// =========================

return (
    <div className="expense-card">

        <div className="expense-card-header">

            <div className="expense-info">

                <h3>
                    {expense.description}
                </h3>

                <p className="expense-paid-by">
                    Paid by{" "}
                    <strong>
                        {expense.paidBy.name}
                    </strong>
                </p>

            </div>


            <div className="expense-actions">

                <span className="expense-amount">
                    ₹{Number(expense.amount).toFixed(2)}
                </span>


                {/* EDIT */}

                <button
                    className="expense-action-btn expense-edit-btn"
                    onClick={() =>
                        setEditing(true)
                    }
                    title="Edit expense"
                >
                    ✏️
                </button>


                {/* DELETE */}

                <button
                    className="expense-action-btn expense-delete-btn"
                    onClick={handleDelete}
                    disabled={deleting}
                    title="Delete expense"
                >
                    {deleting ? (
                        <span
                            className="spinner-border spinner-border-sm"
                            role="status"
                        />
                    ) : (
                        "🗑️"
                    )}
                </button>

            </div>

        </div>


        {/* SPLIT */}

        <div className="expense-split">

            <p className="expense-split-title">
                Split between
            </p>

            <ul className="expense-split-list">

                {expense.splitBetween.map(
                    (split) => (

                        <li
                            className="expense-split-item"
                            key={
                                split.user._id
                            }
                        >
                            {split.user.name}
                            {" → ₹"}
                            {Number(
                                split.amount
                            ).toFixed(2)}
                        </li>

                    )
                )}

            </ul>

        </div>

    </div>
);
};

export default ExpenseCard;