import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";

export default function AdminDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get("http://localhost/gestion_doc_api/documents.php?action=list")
      .then(res => {
        if (Array.isArray(res.data)) {
          setDocuments(res.data);
        } else {
          setDocuments([]);
        }
        setLoading(false);
      })
      .catch(err => {
        setError("Erreur lors du chargement des documents");
        setLoading(false);
      });
  }, []);

  // Actions (à compléter selon besoins)
  const handleEdit = (doc) => {
    // TODO: ouvrir un modal ou une page d'édition
    alert(`Modifier: ${doc.titre}`);
  };
  const handleDelete = (doc) => {
    // TODO: confirmation et suppression via API
    alert(`Supprimer: ${doc.titre}`);
  };

  return (
    <div className="w-full p-6 bg-white rounded-lg shadow-md overflow-x-auto">
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
      ) : Array.isArray(documents) && documents.length > 0 ? (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-blue-50">
              <th className="p-3 font-semibold">Titre</th>
              <th className="p-3 font-semibold">Description</th>
              <th className="p-3 font-semibold">Prix (Ar)</th>
              <th className="p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc, index) => (
              <tr key={doc.id || index} className="border-b hover:bg-blue-50 transition">
                <td className="p-3 font-medium text-blue-800">{doc.titre}</td>
                <td className="p-3 text-gray-700">{doc.description}</td>
                <td className="p-3 text-green-700 font-semibold">{doc.prix}</td>
                <td className="p-3 flex gap-2">
                  <button
                    className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition"
                    onClick={() => handleEdit(doc)}
                  >
                    <FaEdit /> Modifier
                  </button>
                  <button
                    className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition"
                    onClick={() => handleDelete(doc)}
                  >
                    <FaTrash /> Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="text-center py-8 text-gray-500">Aucun document trouvé.</div>
      )}
    </div>
  );
}
