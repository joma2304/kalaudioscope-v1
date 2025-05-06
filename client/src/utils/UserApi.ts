const API_BASE_URL = "http://localhost:3500/api/user"; // Bas-URL för ditt API

// Registrera en ny användare
export const registerUser = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}) => {
    const response = await fetch(`${API_BASE_URL}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
    });

    if (!response.ok) {
        throw new Error("Failed to register user");
    }

    return await response.json();
};

// Logga in en användare
export const loginUser = async (credentials: { email: string; password: string }) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
    });

    if (!response.ok) {
        throw new Error("Failed to log in");
    }

    return await response.json();
};

// Hämta inloggad användares information
export const getUserInfo = async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/me`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to fetch user information");
    }

    return await response.json();
};

// Uppdatera inloggad användares information
export const updateUserInfo = async (token: string, updates: { [key: string]: any }) => {
    const response = await fetch(`${API_BASE_URL}/me`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
    });

    if (!response.ok) {
        throw new Error("Failed to update user information");
    }

    return await response.json();
};

// Ta bort inloggad användares konto
export const deleteUser = async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/me`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to delete user");
    }

    return await response.json();
};