const parseExpense = async (text, members) => {
    const lowerText = text.toLowerCase();

    // Find amount
    const amountMatch = text.match(
        /(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\b/i
    );

    if (!amountMatch) {
        throw new Error(
            "Could not determine expense amount"
        );
    }

    const amount = Number(amountMatch[1]);

    // Find members mentioned in the text
    const mentionedMembers = members.filter((member) =>
        lowerText.includes(member.name.toLowerCase())
    );

    // Determine payer
    let paidBy = mentionedMembers[0];

    const paidByMatch = text.match(
        /([a-zA-Z]+)\s+paid/i
    );

    if (paidByMatch) {
        const payerName =
            paidByMatch[1].toLowerCase();

        paidBy =
            members.find(
                (member) =>
                    member.name.toLowerCase() ===
                    payerName
            );
    }

    if (!paidBy) {
        throw new Error(
            "Could not determine who paid"
        );
    }

    // Determine participants
    let participants = mentionedMembers;

    if (participants.length === 0) {
        participants = members;
    }

    // Determine split type
    const isEqualSplit =
        lowerText.includes("equally") ||
        lowerText.includes("equal") ||
        lowerText.includes("split evenly");

    return {
        description: extractDescription(text),
        amount,
        paidBy: paidBy.name,
        splitType: isEqualSplit
            ? "equal"
            : "custom",
        participants: participants.map(
            (member) => member.name
        )
    };
};


const extractDescription = (text) => {

    const match = text.match(
        /(?:for|on)\s+(.+?)(?:,\s*split|\s+split|$)/i
    );

    if (match) {
        return match[1].trim();
    }

    return "Expense";
};


module.exports = {
    parseExpense
};