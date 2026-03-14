// This file is responsible for making API calls related to the user dashboard.

const base_url = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// API: Get User Simplification Stats
// Method/Path: GET /api/dashboard/user/:userId/stats
// Returns: { totalSimplifications, lawSimplified, judgmentSimplified }
export const getUserSimplificationStats = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required to fetch dashboard stats');
  }

  const response = await fetch(`${base_url}/api/dashboard/user/${userId}/stats`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch dashboard stats');
  }

  return data;
};

// API: Get User Law Simplification History
// Method/Path: GET /api/dashboard/user/:userId/law-simplifications?page&limit
// Expected shape:
// {
//   page, limit, total,
//   items: [ { id, inputType, fileName, userQuery, aiResponse, createdAt } ]
// }
export const getUserLawSimplificationHistory = async (
  userId,
  page = 1,
  limit = 20
) => {
  if (!userId) {
    throw new Error('User ID is required to fetch law simplification history');
  }

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const response = await fetch(
    `${base_url}/api/dashboard/user/${userId}/law-simplifications?${params.toString()}`
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch law simplification history');
  }

  return data;
};

// API: Get User Judgement Simplification History
// Method/Path: GET /api/dashboard/user/:userId/judgement-simplifications?page&limit
// Shape matches law history: page, limit, total, items[...]
export const getUserJudgementSimplificationHistory = async (
  userId,
  page = 1,
  limit = 20
) => {
  if (!userId) {
    throw new Error('User ID is required to fetch judgement simplification history');
  }

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const response = await fetch(
    `${base_url}/api/dashboard/user/${userId}/judgement-simplifications?${params.toString()}`
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch judgement simplification history');
  }

  return data;
};

// API: Get User All Simplifications (latest 5 combined)
// Method/Path: GET /api/dashboard/user/:userId/all-simplifications
// Shape: array of items with { type, userQuery, aiResponse, isLiked }
export const getUserAllSimplifications = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required to fetch all simplifications');
  }

  const response = await fetch(`${base_url}/api/dashboard/user/${userId}/all-simplifications`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch all simplifications');
  }

  return data;
};