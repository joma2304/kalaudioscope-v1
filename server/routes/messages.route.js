import express from 'express';
import { sendMessage, getMessagesByRoomId } from '../controllers/message.controller.js';

const router = express.Router();

router.post("/send", sendMessage);
router.get("/messages/:roomId", getMessagesByRoomId)

export default router;