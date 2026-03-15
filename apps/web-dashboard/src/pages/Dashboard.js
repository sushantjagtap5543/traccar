import React,{useEffect,useState} from "react";
import {api} from "../api/client";

export default function Dashboard(){

  const [devices,setDevices] = useState([]);

  useEffect(()=>{

    api("/api/devices")
      .then(setDevices);

  },[]);

  return(

    <div>

      <h2>Devices</h2>

      {devices.map(device=>(
        <div key={device.id}>
          {device.name}
        </div>
      ))}

    </div>

  );

}
