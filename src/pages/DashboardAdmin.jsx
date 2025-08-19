
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import AdminStatistics from "../components/AdminStatistics.jsx";
import AdminDocuments from "../components/AdminDocuments.jsx";
import AdminHistory from "../components/AdminHistory.jsx";

function DashboardAdmin() {
  const location = useLocation();
  const current = location.pathname;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-md p-4">
        <h1 className="text-2xl font-bold text-indigo-700">DokuAccess</h1>
        <h2 className="text-lg text-gray-600">Tableau de Bord Administrateur</h2>
        <p className="text-sm text-gray-500">Gérez vos documents, consultez l'historique et les statistiques.</p>
      </nav>

      {/* Menu principal en haut */}
      <div className="p-4 bg-white shadow-sm flex gap-4 border-b">
        <Link
          to="statistics"
          className={`px-4 py-2 rounded transition font-medium ${current.endsWith("statistics") ? "bg-green-100 text-green-800" : "hover:bg-gray-100"}`}
        >
          Statistiques
        </Link>
        <Link
          to="documents"
          className={`px-4 py-2 rounded transition font-medium ${current.endsWith("documents") || current.endsWith("admin") ? "bg-green-100 text-green-800" : "hover:bg-gray-100"}`}
        >
          Documents
        </Link>
        <Link
          to="history"
          className={`px-4 py-2 rounded transition font-medium ${current.endsWith("history") ? "bg-green-100 text-green-800" : "hover:bg-gray-100"}`}
        >
          Historique
        </Link>
      </div>

      {/* Contenu dynamique via route imbriquée */}
      <div className="p-6 w-full max-w-3xl mx-auto">
        <Routes>
          <Route path="statistics" element={<AdminStatistics />} />
          <Route path="documents" element={<AdminDocuments />} />
          <Route path="history" element={<AdminHistory />} />
          <Route index element={<AdminDocuments />} />
        </Routes>
      </div>
    </div>
  );
}

export default DashboardAdmin;