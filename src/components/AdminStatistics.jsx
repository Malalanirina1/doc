
import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaChartBar } from "react-icons/fa";

export default function AdminStatistics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get("http://localhost/gestion_doc_api/statistics.php")
      .then(res => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError("Erreur lors du chargement des statistiques");
        setLoading(false);
      });
  }, []);

  return (
    <div className="w-full p-6 bg-white/70 backdrop-blur-sm rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-blue-700 mb-4 flex items-center gap-2">
        <FaChartBar /> Statistiques
      </h2>
      {loading ? (
        <div className="text-center py-8 text-blue-500 font-semibold">Chargement...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500 font-semibold">{error}</div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-100 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-700">{stats.documents}</div>
            <div className="text-blue-700">Documents</div>
          </div>
          <div className="bg-green-100 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-700">{stats.users}</div>
            <div className="text-green-700">Utilisateurs</div>
          </div>
          <div className="bg-yellow-100 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-yellow-700">{stats.sales}</div>
            <div className="text-yellow-700">Ventes</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
