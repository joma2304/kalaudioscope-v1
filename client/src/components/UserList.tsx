interface UserListProps {
    users: string[];
}

const UserList: React.FC<UserListProps> = ({ users }) => {
    return (
        <p className="users-in-room">
            Användare i rummet: <strong>{users.join(", ")}</strong>
        </p>
    );
};

export default UserList;