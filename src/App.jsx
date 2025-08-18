import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import DashboardAdmin from "./DashboardAdmin";
import DashboardAssistant from "./DashboardAssistant";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<DashboardAdmin />} />
        <Route path="/assistant" element={<DashboardAssistant />} />
      </Routes>
    </Router>
  );
}

export default App;
