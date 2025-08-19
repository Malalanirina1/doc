import React from "react";
import { FaHistory } from "react-icons/fa";

export default function AdminHistory() {
  return (
    <div className="p-6 bg-white/70 backdrop-blur-sm rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-blue-700 mb-4 flex items-center gap-2">
        <FaHistory /> Historique
      </h2>
      <p>Votre historique sera affiché ici.</p>
    </div>
  );
}
