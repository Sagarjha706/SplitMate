import { useState } from "react";
import { useNavigate } from "react-router-dom";

import API from "../services/api";
import Navbar from "../components/Navbar";

import "../CreateGroup.css";

const CreateGroup = () => {

    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [description, setDescription] =
        useState("");

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const token =
        localStorage.getItem("token");


    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");

        if (!name.trim()) {

            setError(
                "Please enter a group name"
            );

            return;
        }

        try {

            setLoading(true);

            await API.post(
                "/groups",
                {
                    name: name.trim(),
                    description:
                        description.trim()
                },
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            navigate("/dashboard");

        } catch (error) {

            console.error(error);

            if (
                error.response?.status === 401
            ) {

                localStorage.removeItem(
                    "token"
                );

                localStorage.removeItem(
                    "user"
                );

                navigate("/login");

                return;
            }

            setError(
                error.response?.data?.message ||
                "Failed to create group"
            );

        } finally {

            setLoading(false);

        }
    };


    return (

        <div className="create-group-page">

            <Navbar />

            <main className="create-group-container">

                {/* BACK */}

                <button
                    className="create-group-back"
                    onClick={() =>
                        navigate("/dashboard")
                    }
                >
                    ← Back to Dashboard
                </button>


                {/* CARD */}

                <div className="create-group-card">

                    {/* HEADER */}

                    <div className="create-group-header">

                        <div>

                            <h1 className="align-start">
                                Create New Group
                            </h1>

                            <p>
                                Create a group to start
                                tracking shared expenses.
                            </p>

                        </div>


                        <div className="create-group-icon">
                            +
                        </div>

                    </div>


                    {/* ERROR */}

                    {error && (

                        <div className="create-group-error">

                            <span>
                                ⚠
                            </span>

                            <span>
                                {error}
                            </span>

                        </div>

                    )}


                    {/* FORM */}

                    <form
                        onSubmit={handleSubmit}
                        className="create-group-form"
                    >

                        {/* GROUP NAME */}

                        <div className="create-group-field">

                            <label>
                                Group Name
                            </label>

                            <input
                                type="text"
                                placeholder="e.g. Goa Trip"
                                value={name}
                                onChange={(e) =>
                                    setName(
                                        e.target.value
                                    )
                                }
                            />

                        </div>


                        {/* DESCRIPTION */}

                        <div className="create-group-field">

                            <label>
                                Description
                            </label>

                            <textarea
                                placeholder="e.g. Expenses for our Goa trip"
                                value={
                                    description
                                }
                                onChange={(e) =>
                                    setDescription(
                                        e.target.value
                                    )
                                }
                                rows="4"
                            />

                        </div>


                        {/* BUTTON */}

                        <button
                            type="submit"
                            className="create-group-btn"
                            disabled={loading}
                        >

                            {loading ? (

                                <>
                                    <span
                                        className="spinner-border spinner-border-sm me-2"
                                        role="status"
                                    />

                                    Creating...
                                </>

                            ) : (

                                <>
                                    <span className="me-2">
                                        +
                                    </span>

                                    Create Group
                                </>

                            )}

                        </button>

                    </form>

                </div>

            </main>

        </div>
    );
};

export default CreateGroup;