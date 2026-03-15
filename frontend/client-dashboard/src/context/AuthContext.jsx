import { createContext, useState, useEffect, useContext } from "react";
import { getAccount, login as apiLogin, logout as apiLogout } from "../services/authService";
import socketService from "../services/socketService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getAccount();
        setUser(data);
        const token = localStorage.getItem("token");
        if (token) socketService.connect(token);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();

    return () => socketService.disconnect();
  }, []);

  const loginUser = async (email, password) => {
    const data = await apiLogin(email, password);
    const token = localStorage.getItem("token");
    setUser(data);
    if (token) socketService.connect(token);
    return data;
  };

  const logoutUser = async () => {
    await apiLogout();
    socketService.disconnect();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loginUser, logoutUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
