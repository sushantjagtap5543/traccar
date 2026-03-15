async function loadDevices(){

const devices = await fetch("http://localhost:8082/api/devices")
.then(r=>r.json());

const table = document.querySelector("#deviceTable tbody");

devices.forEach(d=>{

let row = document.createElement("tr");

row.innerHTML = `
<td>${d.id}</td>
<td>${d.name}</td>
<td>${d.status || "Unknown"}</td>
`;

table.appendChild(row);

});

}

loadDevices();
