interface JoinFormProps {
    name: string;
    setName: (value: string) => void;
    ticketNumber: string;
    setTicketNumber: (value: string) => void;
    joinRoom: (e: React.FormEvent) => void;
    error: string;
}

const JoinForm: React.FC<JoinFormProps> = ({ name, setName, ticketNumber, setTicketNumber, joinRoom, error }) => {
    return (
        <form onSubmit={joinRoom}>
            <input
                type="text"
                placeholder="Ditt namn"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
            />
            <input
                type="text"
                placeholder="Biljettnummer (10 siffror)"
                value={ticketNumber}
                onChange={(e) => {
                    if (/^\d*$/.test(e.target.value)) {
                        setTicketNumber(e.target.value);
                    }
                }}
                maxLength={10}
                required
            />
            {error && <p className="error-message">{error}</p>}
            <button type="submit">Anslut till föreställning</button>
        </form>
    );
};

export default JoinForm;