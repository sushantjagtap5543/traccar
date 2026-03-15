import API from "./api";

export const login = async (email, password) => {
  const res = await API.post("/session", new URLSearchParams({
    email,
    password,
  }), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });
  return res.data;
};

export const register = async (name, email, password) => {
  const res = await API.post("/users", {
    name,
    email,
    password,
  });
  return res.data;
};

export const logout = async () => {
  const res = await API.delete("/session");
  return res.data;
};

export const getAccount = async () => {
  const res = await API.get("/session");
  return res.data;
};
