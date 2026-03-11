export default async (input, init) => {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const url = (typeof input === 'string' && input.startsWith('/')) ? `${apiUrl}${input}` : input;
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response;
};
