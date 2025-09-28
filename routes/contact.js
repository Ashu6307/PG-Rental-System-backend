
import express from 'express';
import multer from 'multer';
import Contact from '../models/Contact.js';
const router = express.Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/contacts/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.post('/', upload.array('attachments'), async (req, res) => {
  try {
    const attachments = req.files ? req.files.map(f => f.path) : [];
    const contact = new Contact({ ...req.body, attachments });
    await contact.save();
    res.json({ success: true, data: contact });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({ success: true, data: contacts });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;