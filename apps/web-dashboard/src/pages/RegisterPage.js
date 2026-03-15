import React,{useState} from "react";
import {register} from "../api/register";

export default function RegisterPage(){

  const [user,setUser] = useState({
    name:"",
    email:"",
    password:""
  });

  const submit = async (e)=>{

    e.preventDefault();

    await register(user);

    alert("Account created");

    window.location="/login";

  };

  return(

    <form onSubmit={submit}>

      <input
        placeholder="Name"
        onChange={e=>setUser({...user,name:e.target.value})}
      />

      <input
        placeholder="Email"
        onChange={e=>setUser({...user,email:e.target.value})}
      />

      <input
        type="password"
        placeholder="Password"
        onChange={e=>setUser({...user,password:e.target.value})}
      />

      <button>Create Account</button>

    </form>

  );

}
