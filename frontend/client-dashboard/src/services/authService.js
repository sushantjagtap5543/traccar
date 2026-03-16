import API from "./api";

// login with mobile and password (or OTP if password not set)
export const login = async (mobile, password) => {
  const res = await API.post("/auth/login", {
    mobile,
    password,
  });
  if (res.data.accessToken) {
    localStorage.setItem("token", res.data.accessToken);
  }
  return res.data;
};

// request OTP for registration
export const requestOtp = async (mobile) => {
  const res = await API.post("/auth/register", {
    mobile,
  });
  return res.data;
};

// verify OTP and get token
export const verifyOtp = async (mobile, code) => {
  const res = await API.post("/auth/verify", {
    mobile,
    code,
  });
  if (res.data.accessToken) {
    localStorage.setItem("token", res.data.accessToken);
  }
  return res.data;
};

// complete profile
export const completeProfile = async (name, email, password) => {
  const res = await API.put("/auth/profile", {
    name,
    email,
    password,
  });
  return res.data;
};

export const logout = () => {
  localStorage.removeItem("token");
};

export const getAccount = async () => {
  const res = await API.get("/auth/profile"); // Assuming this exists or using a generic me endpoint
  return res.data;
};
