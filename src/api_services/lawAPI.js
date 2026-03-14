// This file is responsible for making API calls related to law simplifier.

const base_url = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Law simplifier API call
// Backend supports:
// - multipart/form-data with fields: file (optional PDF), text (optional), userId (optional)
// - OR JSON body: { text, userId }
export const lawSimplifier = async (payload) => {
  try {
    const options = { method: 'POST' };

    if (payload instanceof FormData) {
      options.body = payload;
    } else {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(payload);
    }

    const response = await fetch(`${base_url}/api/law/simplify`, options);
    const data = await response.json();

    if (!response.ok) {
      // Surface backend validation / guardrail messages (e.g. NOT_INDIAN_LAW)
      throw new Error(data.message || 'Failed to simplify law');
    }

    if (data.message !== null && typeof data.simplifiedText === 'string') {
      return data; // Return full data object to include recordId and isLiked
    }

    throw new Error('Invalid response from law simplifier');
  } catch (error) {
    throw error;
  }
};

// API: Update Like/Save status for a law simplification record
export const likeLaw = async (userId, id, isLiked) => {
  try {
    const response = await fetch(`${base_url}/api/dashboard/user/${userId}/law/${id}/like`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isLiked }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update save status');
    }

    return data;
  } catch (error) {
    throw error;
  }
};
