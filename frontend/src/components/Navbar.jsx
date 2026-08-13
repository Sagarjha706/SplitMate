import { useNavigate } from "react-router-dom";
import "../Navbar.css";

const Navbar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");
    };

    return (
        <nav className="navbar navbar-custom">
            <div
                className="navbar-logo"
                onClick={() => navigate("/dashboard")}
            >
                <span className="navbar-logo-icon">
                    <img src="/logo.png" alt="SplitMate Logo" className="navbar-logo-image" />
                </span>

                <span>SplitMate</span>
            </div>

            <div className="navbar-right">

                <button
                    className="logout-btn"
                    onClick={handleLogout}
                >
                    Logout
                </button>

            </div>
        </nav>
    );
};

export default Navbar;