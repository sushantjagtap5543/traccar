export async function api(url, options = {}) {

  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };

  const response = await fetch(url,{
    ...options,
    headers
  });

  return response.json();
}
