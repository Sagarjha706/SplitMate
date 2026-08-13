import { useState } from "react";
import { useNavigate } from "react-router-dom";

import API from "../services/api";

import "../Auth.css";

const Signup = () => {

    const [name, setName] =
        useState("");

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const navigate = useNavigate();


    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");

        if (!name.trim()) {
            setError(
                "Please enter your name"
            );
            return;
        }

        if (!email.trim()) {
            setError(
                "Please enter your email"
            );
            return;
        }

        if (!password) {
            setError(
                "Please enter a password"
            );
            return;
        }

        try {

            setLoading(true);

            await API.post(
                "/auth/signup",
                {
                    name: name.trim(),
                    email: email.trim(),
                    password
                }
            );


            // Go to login

            navigate("/login");

        } catch (error) {

            console.error(error);

            setError(
                error.response?.data
                    ?.message ||
                "Signup failed"
            );

        } finally {

            setLoading(false);

        }
    };


    return (

        <div className="auth-page">

            <div className="auth-card">

                {/* LOGO */}

                <div className="auth-logo">

                    <span className="auth-logo-icon">
                        ₹
                    </span>

                    <span>
                        SplitWise
                    </span>

                </div>


                {/* HEADER */}

                <div className="auth-header">

                    <h1>
                        Create Account
                    </h1>

                    <p>
                        Start splitting expenses
                        with your friends.
                    </p>

                </div>


                {/* ERROR */}

                {error && (
                    <div className="auth-error">
                        {error}
                    </div>
                )}


                {/* FORM */}

                <form
                    onSubmit={handleSubmit}
                    className="auth-form"
                >

                    <div className="auth-field">

                        <label>
                            Name
                        </label>

                        <input
                            type="text"
                            placeholder="Your name"
                            value={name}
                            onChange={(e) =>
                                setName(
                                    e.target.value
                                )
                            }
                        />

                    </div>


                    <div className="auth-field">

                        <label>
                            Email
                        </label>

                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) =>
                                setEmail(
                                    e.target.value
                                )
                            }
                        />

                    </div>


                    <div className="auth-field">

                        <label>
                            Password
                        </label>

                        <input
                            type="password"
                            placeholder="Create a password"
                            value={password}
                            onChange={(e) =>
                                setPassword(
                                    e.target.value
                                )
                            }
                        />

                    </div>


                    <button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={loading}
                    >

                        {loading ? (

                            <>
                                <span
                                    className="spinner-border spinner-border-sm me-2"
                                    role="status"
                                />

                                Creating account...
                            </>

                        ) : (
                            "Create Account"
                        )}

                    </button>

                </form>


                {/* LOGIN */}

                <div className="auth-switch">

                    Already have an account?{" "}

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/login")
                        }
                    >
                        Login
                    </button>

                </div>

            </div>

        </div>
    );
};

export default Signup;