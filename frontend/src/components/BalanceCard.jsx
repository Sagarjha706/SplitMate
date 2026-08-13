import "../BalanceCard.css";

const BalanceCard = ({
    balance,
    currentUserId,
    onSettle,
    settling
}) => {

    const isCurrentUser =
        currentUserId === balance.from.id;

    return (
        <div className="balance-card">

            <div className="balance-info">

                <strong>
                    {balance.from.name}
                </strong>

                <span>
                    owes
                </span>

                <strong>
                    {balance.to.name}
                </strong>

                <span className="balance-amount">
                    ₹{Number(balance.amount).toFixed(2)}
                </span>

            </div>

            {isCurrentUser && (
                <button
                    className="settle-btn"
                    onClick={() =>
                        onSettle(balance)
                    }
                    disabled={settling}
                >
                    {settling
                        ? "Settling..."
                        : `Settle ₹${Number(
                            balance.amount
                        ).toFixed(2)}`}
                </button>
            )}

        </div>
    );
};

export default BalanceCard;