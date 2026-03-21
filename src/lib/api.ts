const BASE_URL = import.meta.env.VITE_API_URL;

export const api = {
  post: async (path: string, body: object, token?: string) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify(body)
    });
    return res.json();
  },

  get: async (path: string, token?: string) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      }
    });
    return res.json();
  }
};