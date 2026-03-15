export async function register(user) {

  const response = await fetch("/traccar/api/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(user)
  });

  if (!response.ok) {
    throw new Error("Registration failed");
  }

  return response.json();
}
