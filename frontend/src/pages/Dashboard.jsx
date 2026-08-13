import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";

import "../Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [groupBalances, setGroupBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));

  const token = localStorage.getItem("token");

  const currentUserId = user?.id || user?._id;

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // =========================
  // FETCH DASHBOARD DATA
  // =========================

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const groupsResponse = await API.get("/groups", config);

        const fetchedGroups = groupsResponse.data.groups;

        setGroups(fetchedGroups);

        const balanceResults = {};

        await Promise.all(
          fetchedGroups.map(async (group) => {
            try {
              const response = await API.get(
                `/groups/${group._id}/balances`,
                config,
              );

              balanceResults[group._id] = response.data.settlements || [];
            } catch (error) {
              console.error(`Failed to get balance for ${group.name}`, error);

              balanceResults[group._id] = [];
            }
          }),
        );

        setGroupBalances(balanceResults);
      } catch (error) {
        console.error(error);

        if (error.response?.status === 401) {
          localStorage.removeItem("token");

          localStorage.removeItem("user");

          navigate("/login");
        } else {
          setError("Failed to load dashboard");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  // =========================
  // CALCULATE TOTALS
  // =========================

  let totalYouOwe = 0;
  let totalYouAreOwed = 0;

  groups.forEach((group) => {
    const balances = groupBalances[group._id] || [];

    balances.forEach((balance) => {
      if (balance.from.id === currentUserId) {
        totalYouOwe += Number(balance.amount);
      }

      if (balance.to.id === currentUserId) {
        totalYouAreOwed += Number(balance.amount);
      }
    });
  });

  totalYouOwe = Number(totalYouOwe.toFixed(2));

  totalYouAreOwed = Number(totalYouAreOwed.toFixed(2));

  const netBalance = Number((totalYouAreOwed - totalYouOwe).toFixed(2));

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="dashboard-page">
        <Navbar />

        <div className="dashboard-container">
          <div className="empty-state">
            <h2>Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // DASHBOARD
  // =========================

  return (
    <div className="dashboard-page">
      <Navbar />

      <div className="dashboard-container">
        {/* =========================
                    WELCOME
                ========================= */}

        <div className="dashboard-welcome ">
          <h1>Good to see you, {user?.name || "there"} 👋</h1>

          <p>Here's your expense overview.</p>
        </div>

        {/* =========================
                    ERROR
                ========================= */}

        {error && <p className="dashboard-error">{error}</p>}

        {/* =========================
                    FINANCIAL SUMMARY
                ========================= */}

        <div className="summary-grid">
          {/* YOU OWE */}

          <div className="summary-card">
            <p className="">You owe</p>

            <h2 className="text-danger">₹{totalYouOwe.toFixed(2)}</h2>
          </div>

          {/* YOU ARE OWED */}

          <div className="summary-card">
            <p>You're owed</p>

            <h2 className="text-success">₹{totalYouAreOwed.toFixed(2)}</h2>
          </div>

          {/* NET BALANCE */}

          <div className="summary-card">
            <p>Net balance</p>

            <h2 className={netBalance >= 0 ? "text-success" : "text-danger"}>
              {netBalance >= 0 ? "+" : "-"}₹{Math.abs(netBalance).toFixed(2)}
            </h2>
          </div>
        </div>

        {/* =========================
                    GROUP HEADER
                ========================= */}

        <div className="groups-header">
          <h2>Your Groups</h2>

          <button
            className="btn btn-primary"
            onClick={() => navigate("/groups/create")}
          >
            + New Group
          </button>
        </div>

        {/* =========================
                    NO GROUPS
                ========================= */}

        {groups.length === 0 ? (
          <div className="empty-state">
            <h3>No groups yet</h3>

            <p>Create your first group to start tracking expenses.</p>

            <button
              className="btn btn-primary"
              onClick={() => navigate("/groups/create")}
            >
              Create Group
            </button>
          </div>
        ) : (
          /* =========================
                       GROUP LIST
                    ========================= */

          <div className="groups-list">
            {groups.map((group) => {
              const balances = groupBalances[group._id] || [];

              let groupYouOwe = 0;

              let groupYouAreOwed = 0;

              balances.forEach((balance) => {
                if (balance.from.id === currentUserId) {
                  groupYouOwe += Number(balance.amount);
                }

                if (balance.to.id === currentUserId) {
                  groupYouAreOwed += Number(balance.amount);
                }
              });

              return (
                <div className="group-card" key={group._id}>
                  <div className="group-card-content">
                    <div>
                      <h3>{group.name}</h3>

                      <p className="group-members">
                        {group.members.length} members
                      </p>

                      <div className="group-balance">
                        {groupYouOwe > 0 && (
                          <span className="you-owe">
                            You owe ₹{groupYouOwe.toFixed(2)}
                          </span>
                        )}

                        {groupYouAreOwed > 0 && (
                          <span className="you-are-owed">
                            You're owed ₹{groupYouAreOwed.toFixed(2)}
                          </span>
                        )}

                        {groupYouOwe === 0 && groupYouAreOwed === 0 && (
                          <span className="settled">Settled up ✓</span>
                        )}
                      </div>
                    </div>

                    <button
                      className="open-group-btn"
                      onClick={() => navigate(`/groups/${group._id}`)}
                    >
                      Open →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
