var map = L.map('map').setView([20,78],5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{

maxZoom:19

}).addTo(map);

async function loadPositions(){

const positions = await fetch("http://localhost:8082/api/positions")
.then(r=>r.json());

positions.forEach(p=>{

L.marker([p.latitude,p.longitude])
.addTo(map)
.bindPopup("Device ID: "+p.deviceId);

});

}

loadPositions();
