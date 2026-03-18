import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Devices from "./pages/Devices";
import History from "./pages/History";
import Geofencing from "./pages/Geofencing";
import Reports from "./pages/Reports";
import Alerts from "./pages/Alerts";
import Drivers from "./pages/Drivers";
import BillingPage from "./pages/BillingPage";
import Services from "./pages/Services";
import SharePortal from "./pages/SharePortal";
import ProtectedRoute from "./routes/ProtectedRoute";
import Navbar from "./components/Navbar";
import { useAuth } from "./context/AuthContext";

function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <div className="app-container">
        {user && <Navbar />}
        <div className="main-layout">
          <main className={user ? "content-area authenticated-content" : "content-area"}>
            <Routes>
              <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
              <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
              <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/dashboard" />} />
              
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

              <Route path="/history" element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              } />

              <Route path="/geofencing" element={
                <ProtectedRoute>
                  <Geofencing />
                </ProtectedRoute>
              } />

              <Route path="/reports" element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              } />

              <Route path="/alerts" element={
                <ProtectedRoute>
                  <Alerts />
                </ProtectedRoute>
              } />

              <Route path="/drivers" element={
                <ProtectedRoute>
                  <Drivers />
                </ProtectedRoute>
              } />

              <Route path="/billing" element={
                <ProtectedRoute>
                  <BillingPage />
                </ProtectedRoute>
              } />

              <Route path="/maintenance" element={
                <ProtectedRoute>
                  <Services />
                </ProtectedRoute>
              } />

              <Route path="/share/:code" element={<SharePortal />} />

              <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;

