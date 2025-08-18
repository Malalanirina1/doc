import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("assistant");

  const handleRegister = async () => {
    try {
      const res = await axios.post("http://localhost/gestion_doc_api/register.php", {
        username,
        password,
        role,
      });
      console.log(res.data);
      if (res.data.success) {
        alert("Compte créé avec succès !");
        setUsername("");
        setPassword("");
        setRole("assistant");
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        {/* Flèche retour vers login */}
        <Link to="/" style={styles.backLink}>&larr; Retour</Link>

        <h2 style={styles.title}>Créer un compte utilisateur</h2>
        <input
          style={styles.input}
          type="text"
          placeholder="Nom utilisateur"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <select
          style={styles.input}
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="assistant">Assistant</option>
          <option value="admin">Admin</option>
        </select>
        <button style={styles.button} onClick={handleRegister}>
          Créer un compte
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f0f2f5", fontFamily: "Arial, sans-serif" },
  box: { backgroundColor: "white", padding: "40px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", textAlign: "center", width: "320px" },
  backLink: { display: "block", textAlign: "left", marginBottom: "10px", color: "#6DA6D6FF", textDecoration: "none", fontSize: "14px", fontWeight: "bold" },
  title: { marginBottom: "20px", color: "#9F619FFF" },
  input: { width: "100%", padding: "12px", margin: "8px 0", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px" },
  button: { width: "100%", padding: "12px", margin: "12px 0", backgroundColor: "#C07ABBFF", color: "white", border: "none", borderRadius: "6px", fontSize: "16px", cursor: "pointer" },
};

export default Register;
