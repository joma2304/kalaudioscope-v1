interface ActivityIndicatorProps {
    activity: string;
}

const ActivityIndicator: React.FC<ActivityIndicatorProps> = ({ activity }) => {
    return <p className="activity">{activity}</p>;
};

export default ActivityIndicator;