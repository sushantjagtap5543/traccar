import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Devices from "./pages/Devices";
import ProtectedRoute from "./routes/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import { useAuth } from "./context/AuthContext";

function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <div className="app-container">
        {user && <Navbar />}
        <div className="main-layout">
          {user && <Sidebar />}
          <main className={user ? "content authenticated" : "content"}>
            <Routes>
              <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
              <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
              
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/devices" element={
                <ProtectedRoute>
                  <Devices />
                </ProtectedRoute>
              } />

              <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
