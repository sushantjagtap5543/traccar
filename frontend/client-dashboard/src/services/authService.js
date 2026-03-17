import API from "./api";

// login with mobile and password
export const login = async (mobile, password) => {
  const res = await API.post("/auth/login-mobile", {
    whatsapp_number: mobile,
    password,
  });
  if (res.data.accessToken) {
    localStorage.setItem("token", res.data.accessToken);
  }
  return res.data;
};

// request OTP for registration
export const requestOtp = async (mobile) => {
  const res = await API.post("/auth/send-otp", {
    whatsapp_number: mobile,
  });
  return res.data;
};

// verify OTP
export const verifyOtp = async (mobile, code) => {
  const res = await API.post("/auth/verify-otp", {
    whatsapp_number: mobile,
    otp: code,
  });
  return res.data;
};

// complete profile / register
export const completeProfile = async (mobile, name, email, password) => {
  const res = await API.post("/auth/register", {
    mobile,
    name,
    email,
    password,
  });
  if (res.data.accessToken) {
    localStorage.setItem("token", res.data.accessToken);
  }
  return res.data;
};

export const logout = () => {
  localStorage.removeItem("token");
};

export const getAccount = async () => {
  const res = await API.get("/auth/profile"); // Assuming this exists or using a generic me endpoint
  return res.data;
};
export const requestPasswordReset = async (mobile) => {
  const res = await API.post("/auth/reset-password/request", {
    whatsapp_number: mobile,
  });
  return res.data;
};

export const confirmPasswordReset = async (mobile, code, password) => {
  const res = await API.post("/auth/reset-password/confirm", {
    whatsapp_number: mobile,
    otp: code,
    password: password,
  });
  return res.data;
};
