import React, { useState } from "react";
import { login } from "../api/session";

export default function LoginPage() {

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      const data = await login(email,password);

      localStorage.setItem("token",data.token);

      window.location.href="/dashboard";

    } catch(err) {
      alert("Login failed");
    }

  };

  return (

    <form onSubmit={handleSubmit}>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e=>setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e=>setPassword(e.target.value)}
      />

      <button type="submit">
        Login
      </button>

    </form>

  );

}
