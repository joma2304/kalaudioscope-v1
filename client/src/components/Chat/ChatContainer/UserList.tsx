interface UserListProps {
    users: string[];
}

const UserList: React.FC<UserListProps> = ({ users }) => {
    return (
        <p className="users-in-room">
            Users in the room: <strong>{users.join(", ")}</strong>
        </p>
    );
};

export default UserList;