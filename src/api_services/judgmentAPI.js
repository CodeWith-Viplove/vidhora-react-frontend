// This file is responsible for making API calls related to judgment simplifier.

const base_url = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Judgment simplifier API call
// Backend supports multipart/form-data or JSON, same as law simplifier
export const judgmentSimplifier = async (payload) => {
  try {
    const options = { method: 'POST' };

    if (payload instanceof FormData) {
      options.body = payload;
    } else {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(payload);
    }

    const response = await fetch(`${base_url}/api/judgement/simplify`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to simplify judgement');
    }

    if (data.message !== null && typeof data.simplifiedText === 'string') {
      return data; // Return full data object to include recordId and isLiked
    }

    throw new Error('Invalid response from judgement simplifier');
  } catch (error) {
    throw error;
  }
};

// API: Update Like/Save status for a judgement simplification record
export const likeJudgement = async (userId, id, isLiked) => {
  try {
    const response = await fetch(`${base_url}/api/dashboard/user/${userId}/judgement/${id}/like`, {
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
