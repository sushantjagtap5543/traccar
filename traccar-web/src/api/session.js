export async function login(email, password) {
  const response = await fetch("/api/session/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: email,
      password: password
    })
  });

  return response.json();
}
