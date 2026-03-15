export async function login(email, password) {

  const response = await fetch("/traccar/api/session/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: email,
      password: password
    })
  });

  if (!response.ok) {
    throw new Error("Login failed");
  }

  return response.json();
}
