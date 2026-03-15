const BASE_URL = "http://localhost:8082/api";

async function apiFetch(endpoint, options = {}) {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
}
