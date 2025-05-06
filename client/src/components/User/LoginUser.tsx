import React, { useState } from "react";
import { loginUser } from "../../utils/UserApi";

const LoginForm = () => {
    const [credentials, setCredentials] = useState({ email: "", password: "" });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCredentials((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await loginUser(credentials);
            console.log("User logged in:", response);
            localStorage.setItem("token", response.token); // Spara token i localStorage
        } catch (error) {
            console.error("Error logging in:", error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="email"
                name="email"
                placeholder="Email"
                value={credentials.email}
                onChange={handleChange}
            />
            <input
                type="password"
                name="password"
                placeholder="Password"
                value={credentials.password}
                onChange={handleChange}
            />
            <button type="submit">Login</button>
        </form>
    );
};

export default LoginForm;