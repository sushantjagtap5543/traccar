const API = "http://localhost:8082/api/session";

document.getElementById("loginForm").addEventListener("submit", async function(e){

e.preventDefault();

const email = document.getElementById("email").value;
const password = document.getElementById("password").value;

const response = await fetch(API, {

method:"POST",
headers:{
"Content-Type":"application/x-www-form-urlencoded"
},

body:`email=${email}&password=${password}`

});

if(response.ok){

localStorage.setItem("session", "active");
window.location = "dashboard.html";

}else{

alert("Login failed");

}

});
