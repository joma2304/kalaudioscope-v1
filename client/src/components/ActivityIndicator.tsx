interface ActivityIndicatorProps {
    activity: string;
}

const ActivityIndicator: React.FC<ActivityIndicatorProps> = ({ activity }) => {
    return <p>{activity}</p>;
};

export default ActivityIndicator;