import React, { useEffect, useState } from "react";

export default function ClientDashboard(){

 const [vehicles,setVehicles]=useState([]);

 useEffect(()=>{
  fetch("/api/client/devices")
  .then(r=>r.json())
  .then(setVehicles)
 },[]);

 return(
  <div className="p-8 bg-slate-900 min-h-screen text-white">
   <h2 className="text-2xl font-bold mb-6">My Vehicles</h2>
   <div className="p-6 bg-slate-800 rounded-xl shadow-lg border border-slate-700 max-w-sm">
      <p className="text-slate-400 text-sm uppercase font-bold">Total Fleet Size</p>
      <p className="text-4xl font-black">{vehicles.length}</p>
   </div>
  </div>
 )
}
