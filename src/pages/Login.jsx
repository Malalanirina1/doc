import React, { useState } from "react";
import { useToast } from "../components/Toast.jsx";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost/gestion_doc_api/login.php", {
        username,
        password,
      });
      if (res.data.success) {
        showToast("Connexion réussie, rôle: " + res.data.role, "success");
        // Redirection immédiate avec react-router
        if (res.data.role === "admin") {
          navigate("/admin", { replace: true });
        } else if (res.data.role === "assistant") {
          navigate("/assistant", { replace: true });
        }
      } else {
        showToast(res.data.message, "error");
      }
    } catch (err) {
      showToast("Erreur serveur", "error");
      console.error(err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-50 font-sans">
      <div className="bg-white p-10 rounded-xl shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-blue-700">Connexion</h2>
        <input
          className="w-full px-4 py-3 mb-3 rounded-md border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
          type="text"
          placeholder="Nom utilisateur"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="w-full px-4 py-3 mb-3 rounded-md border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          className="w-full py-3 mb-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold text-lg transition duration-150"
          onClick={handleLogin}
        >
          Se connecter
        </button>
        <div className="flex justify-between text-sm">
          <a href="#" className="text-blue-500 hover:underline">Mot de passe oublié ?</a>
          <Link to="/register" className="text-blue-500 hover:underline">Créer un compte</Link>
        </div>
      </div>
    </div>
  );
}

// ...existing code...
export default Login;
