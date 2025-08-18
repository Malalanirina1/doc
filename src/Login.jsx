import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost/gestion_doc_api/login.php", {
        username,
        password,
      });

      console.log(res.data);

      if (res.data.success) {
        alert("Connexion réussie, rôle: " + res.data.role);

        // ✅ Redirection selon rôle
        if (res.data.role === "admin") {
          navigate("/admin");
        } else if (res.data.role === "assistant") {
          navigate("/assistant");
        }
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
        <h2 style={styles.title}>Connexion</h2>
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
        <button style={styles.button} onClick={handleLogin}>
          Se connecter
        </button>
        <div style={styles.links}>
          <a href="#" style={styles.link}>Mot de passe oublié ?</a>
          <Link to="/register" style={styles.link}>Créer un compte</Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f0f2f5",
    fontFamily: "Arial, sans-serif",
  },
  box: {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
    textAlign: "center",
    width: "320px",
  },
  title: {
    marginBottom: "20px",
    color: "#9F619FFF",
  },
  input: {
    width: "100%",
    padding: "12px",
    margin: "8px 0",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  button: {
    width: "100%",
    padding: "12px",
    margin: "12px 0",
    backgroundColor: "#C07ABBFF",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "16px",
    cursor: "pointer",
  },
  links: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
  },
  link: {
    color: "#6DA6D6FF",
    textDecoration: "none",
  },
};

export default Login;
