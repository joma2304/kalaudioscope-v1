import express from 'express';
const router = express.Router();

let rooms = []; // Temporär lista över rum

// Hämta alla rum
router.get("/rooms", (req, res) => {
  res.json(rooms); // Returnera den aktuella listan över rum
});

// Skapa ett nytt rum
router.post("/rooms", (req, res) => {
  const { roomName } = req.body;
  if (roomName && !rooms.includes(roomName)) {
    rooms.push(roomName); // Lägg till det nya rummet i listan
    res.status(201).json({ message: "Rum skapat" });
  } else {
    res.status(400).json({ message: "Rum finns redan eller ogiltigt namn" });
  }
});

export default router;
