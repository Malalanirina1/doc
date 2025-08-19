import React from "react";
import { FaChartBar } from "react-icons/fa";

export default function AdminStatistics() {
  return (
    <div className="p-6 bg-white/70 backdrop-blur-sm rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-blue-700 mb-4 flex items-center gap-2">
        <FaChartBar /> Statistiques
      </h2>
      <p>Vos statistiques seront affichées ici.</p>
    </div>
  );
}
