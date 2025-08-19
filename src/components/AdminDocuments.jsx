
import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";

export default function AdminDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get("http://localhost/gestion_doc_api/documents.php")
      .then(res => {
        setDocuments(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError("Erreur lors du chargement des documents");
        setLoading(false);
      });
  }, []);

  return (
    <div className="w-full p-6 bg-white/70 backdrop-blur-sm rounded-lg shadow-md overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-700">Liste des documents</h2>
          <p className="text-gray-600">Consultez, modifiez ou supprimez les documents existants.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded transition">
          <FaPlus /> Ajouter un document
        </button>
      </div>
      {loading ? (
        <div className="text-center py-8 text-blue-500 font-semibold">Chargement...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500 font-semibold">{error}</div>
      ) : (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b">
              <th className="p-3 font-semibold">Nom du fichier</th>
              <th className="p-3 font-semibold">Prix (Ar)</th>
              <th className="p-3 font-semibold">Code d'accès</th>
              <th className="p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="p-3">{doc.name}</td>
                <td className="p-3">{doc.price}</td>
                <td className="p-3">{doc.code}</td>
                <td className="p-3 flex gap-2">
                  <button className="flex items-center gap-1 bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-600 transition">
                    <FaEdit />
                  </button>
                  <button className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition">
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
