import React, { useState } from "react";
import { useToast } from "../components/Toast.jsx";
import axios from "axios";
import { Link } from "react-router-dom";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("assistant");
  const { showToast } = useToast();

  const handleRegister = async () => {
    try {
      const res = await axios.post("http://localhost/gestion_doc_api/register.php", {
        username,
        password,
        role,
      });
      if (res.data.success) {
        showToast("Compte créé avec succès !", "success");
        setUsername("");
        setPassword("");
        setRole("assistant");
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
        <Link to="/" className="block text-left mb-2 text-blue-500 hover:underline font-bold text-base">&larr; Retour</Link>
        <h2 className="text-2xl font-bold mb-6 text-blue-700">Créer un compte utilisateur</h2>
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
        <select
          className="w-full px-4 py-3 mb-3 rounded-md border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="assistant">Assistant</option>
          <option value="admin">Admin</option>
        </select>
        <button
          className="w-full py-3 mb-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold text-lg transition duration-150"
          onClick={handleRegister}
        >
          Créer un compte
        </button>
      </div>
    </div>
  );
}

// ...existing code...
export default Register;
