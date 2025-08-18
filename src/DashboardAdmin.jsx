import React, { useState } from "react";
import { FaChartBar, FaFileAlt, FaHistory, FaEdit, FaTrash, FaPlus } from "react-icons/fa";

const DokuAccessAdmin = () => {
  const [activeTab, setActiveTab] = useState("documents");

  // Contenu des différents onglets
  const renderTabContent = () => {
    switch (activeTab) {
      case "statistics":
        return <Statistics />;
      case "history":
        return <History />;
      case "documents":
      default:
        return <ListDocuments />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-md p-4">
        <h1 className="text-2xl font-bold text-indigo-700">DokuAccess</h1>
        <h2 className="text-lg text-gray-600">Tableau de Bord Administrateur</h2>
        <p className="text-sm text-gray-500">Gérez vos documents, consultez l'historique et les statistiques.</p>
      </nav>

      {/* Menu principal */}
      <div className="p-4 bg-white shadow-sm flex gap-4 border-b">
        <button
          onClick={() => setActiveTab("statistics")}
          className={`px-4 py-2 rounded transition font-medium ${activeTab === "statistics" ? "bg-green-100 text-green-800" : "hover:bg-gray-100"}`}
        >
          <FaChartBar className="inline mr-2" />
          Statistiques
        </button>
        <button
          onClick={() => setActiveTab("documents")}
          className={`px-4 py-2 rounded transition font-medium ${activeTab === "documents" ? "bg-green-100 text-green-800" : "hover:bg-gray-100"}`}
        >
          <FaFileAlt className="inline mr-2" />
          Documents
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded transition font-medium ${activeTab === "history" ? "bg-green-100 text-green-800" : "hover:bg-gray-100"}`}
        >
          <FaHistory className="inline mr-2" />
          Historique
        </button>
      </div>

      {/* Contenu dynamique */}
      <div className="p-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

// Composant pour les statistiques
function Statistics() {
  return (
    <div className="p-6 bg-white/70 backdrop-blur-sm rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-green-700 mb-4 flex items-center gap-2">
        <FaChartBar /> Statistiques
      </h2>
      <p>Vos statistiques seront affichées ici.</p>
    </div>
  );
}

// Composant pour l'historique
function History() {
  return (
    <div className="p-6 bg-white/70 backdrop-blur-sm rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-green-700 mb-4 flex items-center gap-2">
        <FaHistory /> Historique
      </h2>
      <p>Votre historique sera affiché ici.</p>
    </div>
  );
}

// Composant pour lister les documents
function ListDocuments() {
  const documents = [
    { name: "Contrat de location", price: "2 500", code: "LOCA123" },
    { name: "Attestation de travail", price: "1 500", code: "TRAV456" },
    { name: "Facture proforma", price: "5 000", code: "FACT789" },
  ];

  return (
    <div className="p-6 bg-white/70 backdrop-blur-sm rounded-lg shadow-md overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-grey-700">Liste des documents</h2>
          <p className="text-gray-600">Consultez, modifiez ou supprimez les documents existants.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded transition">
          <FaPlus /> Ajouter un document
        </button>
      </div>
      
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
    </div>
  );
}

export default DokuAccessAdmin;