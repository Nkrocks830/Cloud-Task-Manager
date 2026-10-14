import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import "./Login.css";

function Login() {

  const { loginWithRedirect } = useAuth0();

  const handleAuth0Login = async () => {
    try {
      await loginWithRedirect();
    } catch (error) {
      console.log(error);
      alert("Login Failed");
    }
  };

  return (
    <div className="login-container">

      <div className="login-card">

        <div className="logo">
          ☁
        </div>

        <h1>Cloud Task Manager</h1>

        <p>
          Manage your daily tasks securely
          <br />
          using Cloud Services
        </p>

        <img
          src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
          alt="Task Illustration"
          className="illustration"
        />

        <button
          className="google-btn"
          onClick={handleAuth0Login}
        >
          <img
            src="https://cdn-icons-png.flaticon.com/512/300/300221.png"
            alt="Google"
          />
          Continue with Auth0
        </button>

        <div className="features">
          <p>✔ Secure Login</p>
          <p>✔ Cloud Synchronization</p>
          <p>✔ Access Anywhere</p>
        </div>

      </div>

      <footer>
        © 2026 Cloud Task Manager
      </footer>

    </div>
  );
}

export default Login;