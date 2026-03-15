const API = "http://localhost:8082/api";

async function loadDashboard(){

const devices = await fetch(API+"/devices").then(r=>r.json());
const positions = await fetch(API+"/positions").then(r=>r.json());

document.getElementById("deviceCount").innerText = devices.length;

let online = 0;

devices.forEach(d=>{

if(Date.now() - new Date(d.lastUpdate) < 300000){
online++;
}

});

document.getElementById("onlineDevices").innerText = online;
document.getElementById("offlineDevices").innerText = devices.length - online;

}

loadDashboard();
