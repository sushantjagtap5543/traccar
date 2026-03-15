async function getReport(){

const from = document.getElementById("from").value;
const to = document.getElementById("to").value;

const report = await fetch(
`http://localhost:8082/api/reports/route?deviceId=1&from=${from}&to=${to}`
).then(r=>r.json());

console.log(report);

}
