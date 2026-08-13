import { useState } from "react";
import { useNavigate } from "react-router-dom";

import API from "../services/api";

import "../Auth.css";

const Login = () => {

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

        if (!email.trim() || !password) {
            setError(
                "Please enter your email and password"
            );
            return;
        }

        try {

            setLoading(true);

            const response =
                await API.post(
                    "/auth/login",
                    {
                        email: email.trim(),
                        password
                    }
                );


            // Save JWT

            localStorage.setItem(
                "token",
                response.data.token
            );


            // Save user

            localStorage.setItem(
                "user",
                JSON.stringify(
                    response.data.user
                )
            );


            // Dashboard

            navigate("/dashboard");

        } catch (error) {

            console.error(error);

            setError(
                error.response?.data
                    ?.message ||
                "Login failed"
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
                        Welcome Back
                    </h1>

                    <p>
                        Login to manage your
                        shared expenses.
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
                            placeholder="Enter your password"
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

                                Logging in...
                            </>

                        ) : (
                            "Login"
                        )}

                    </button>

                </form>


                {/* SIGNUP */}

                <div className="auth-switch">

                    Don't have an account?{" "}

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/signup")
                        }
                    >
                        Create one
                    </button>

                </div>

            </div>

        </div>
    );
};

export default Login;   