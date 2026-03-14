// This file is responsible for making API calls related to authentication.

const base_url = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// user login API call
export const loginUser = async (payload) => {
    try {
        const response = await fetch(`${base_url}/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        
        if (data.message !== null && data.token !== null) {
            return {
                authToken: data.token,
                userInfo: data.user
            }
        } else {
            throw new Error('Invalid response from server');
        }
    }
    catch (error) {
        throw error;
    }
}

// user registration API call
export const registerUser = async (payload) => {
    try {
        const response = await fetch(`${base_url}/api/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload) // Fixed: was 'userInfo', now 'payload'
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }

        if (data.message !== null && data.token !== null) {
            return {
                authToken: data.token,
                userInfo: data.user
            }
        } else {
            throw new Error('Invalid response from server');
        }
    }
    catch (error) {
        throw error;
    }
}   

// user logout API call
export const logoutUser = async (user_id) => {
    try {
        // create a payload with user_id
        const payload = {
            user_id: user_id
        }
        const response = await fetch(`${base_url}/api/auth/logout`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Logout failed');
        }
        
        if (data.status === true) {
            return "Logout Successfully !!";
        } else {
            throw new Error('Logout failed');
        }
    }
    catch (error) {
        throw error;
    }
}

// Google auth API call
// Called after successful Google OAuth on frontend with decoded profile
// Payload: { name, email }
// Returns: { authToken, userInfo }
export const googleAuth = async (payload) => {
    try {
        const response = await fetch(`${base_url}/api/auth/google`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Google auth failed");
        }

        if (data.message !== null && data.token !== null) {
            return {
                authToken: data.token,
                userInfo: data.user,
            };
        }

        throw new Error("Invalid response from server");
    } catch (error) {
        throw error;
    }
};
