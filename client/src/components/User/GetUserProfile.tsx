import { useEffect, useState } from "react";
import { getUserInfo } from "../../utils/UserApi";

const UserProfile = () => {
    interface User {
        firstName: string;
        lastName: string;
        email: string;
        ticketNumber: string[];
    }

    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const fetchUserInfo = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const userInfo = await getUserInfo(token);
                setUser(userInfo);
            } catch (error) {
                console.error("Error fetching user info:", error);
            }
        };

        fetchUserInfo();
    }, []);

    if (!user) return <p>Loading...</p>;

    return (
        <div>
            <h1>Welcome, {user.firstName} {user.lastName}</h1>
            <p>Email: {user.email}</p>
            <p>Tickets: {user.ticketNumber.join(", ")}</p>
        </div>
    );
};

export default UserProfile;