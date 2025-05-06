interface User {
    userId: string;
    firstName: string;
    lastName: string;
}

interface UserListProps {
    users: User[];
}

const UserList: React.FC<UserListProps> = ({ users }) => {
    return (
        <p className="users-in-room">
            Users in the room: <strong>
                {users.map(u => `${u.firstName} ${u.lastName}`).join(", ")}
            </strong>
        </p>
    );
};

export default UserList;