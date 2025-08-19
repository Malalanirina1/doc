
import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaHistory } from "react-icons/fa";

export default function AdminHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get("http://localhost/gestion_doc_api/history.php")
      .then(res => {
        setHistory(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError("Erreur lors du chargement de l'historique");
        setLoading(false);
      });
  }, []);

  return (
    <div className="w-full p-6 bg-white/70 backdrop-blur-sm rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-blue-700 mb-4 flex items-center gap-2">
        <FaHistory /> Historique
      </h2>
      {loading ? (
        <div className="text-center py-8 text-blue-500 font-semibold">Chargement...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500 font-semibold">{error}</div>
      ) : history.length ? (
        <ul className="space-y-4">
          {history.map((item, idx) => (
            <li key={idx} className="bg-gray-100 rounded-lg p-4 shadow">
              <div className="font-semibold text-blue-700">{item.action}</div>
              <div className="text-gray-600 text-sm">{item.date}</div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-8 text-gray-500">Aucune activité récente.</div>
      )}
    </div>
  );
}
