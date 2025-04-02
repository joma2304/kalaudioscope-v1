import React from "react";
import { useLocation } from "react-router-dom";

const Show = () => {
  const location = useLocation();
  const { ticketNumber } = location.state || {};

  if (!ticketNumber) {
    return <p>Ingen giltig biljett hittades. Vänligen ange ett biljettnummer.</p>;
  }

  return (
    <div>
      <h2>Föreställning</h2>
      <p>Biljettnummer: {ticketNumber}</p>
      {/* Här kan du lägga till logik för att ladda och visa föreställningen */}
      <div className="show-container">
        <p>Här visas föreställningen...</p>
      </div>
    </div>
  );
};

export default Show;