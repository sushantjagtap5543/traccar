import React,{useState} from "react";
import {register} from "../api/register";

export default function RegisterPage(){

  const [user,setUser] = useState({
    name:"",
    email:"",
    mobile:"",
    password:""
  });

  const submit = async (e)=>{

    e.preventDefault();

    try {
      await register(user);
      alert("Account created successfully");
      window.location="/login";
    } catch (error) {
      alert(error.message || "Registration failed");
    }

  };

  return(

    <form onSubmit={submit}>

      <input
        placeholder="Name"
        required
        onChange={e=>setUser({...user,name:e.target.value})}
      />

      <input
        placeholder="Email"
        type="email"
        required
        onChange={e=>setUser({...user,email:e.target.value})}
      />

      <input
        placeholder="Mobile"
        type="tel"
        required
        onChange={e=>setUser({...user,mobile:e.target.value})}
      />

      <input
        type="password"
        placeholder="Password"
        required
        onChange={e=>setUser({...user,password:e.target.value})}
      />

      <button>Create Account</button>

    </form>

  );

}
