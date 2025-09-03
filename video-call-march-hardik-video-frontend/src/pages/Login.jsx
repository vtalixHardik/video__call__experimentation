import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const [token, setToken] = useState("");
    const navigate = useNavigate();
    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent form submission reload
        localStorage.setItem("token", token); // Store token in localStorage
        alert("Token saved successfully!");
        navigate("/call/23456");
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="mt-5 p-6 flex flex-col">
                <textarea
                    name="token"
                    id="token"
                    placeholder="Enter the token"
                    value={token}
                    className="bg-green-300"
                    rows={10}
                    cols={50}
                    onChange={(e) => setToken(e.target.value)}
                />
                <button type="submit">Submit</button>
            </form>
        </>
    );
};

export default Login;
