import React from "react";
import { Link } from "react-router-dom";

function DashboardAssistant() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📂 Tableau de Bord Assistant</h1>
      <div style={styles.actions}>
        <Link to="/list-doc" style={styles.button}>📑 Lister les Documents</Link>
      </div>
    </div>
  );
}

const styles = {
  container: { textAlign: "center", padding: "50px" },
  title: { color: "#6DA6D6FF" },
  actions: { display: "flex", flexDirection: "column", gap: "10px", marginTop: "30px" },
  button: {
    backgroundColor: "#1877f2",
    color: "white",
    padding: "12px",
    borderRadius: "6px",
    textDecoration: "none",
    fontSize: "16px",
  },
};

export default DashboardAssistant;
