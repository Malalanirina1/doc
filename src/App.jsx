import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardAdmin from "./pages/DashboardAdmin";
import DashboardAssistant from "./pages/DashboardAssistant";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/*" element={<DashboardAdmin />} />
        <Route path="/assistant" element={<DashboardAssistant />} />
      </Routes>
    </Router>
  );
}

export default App;
