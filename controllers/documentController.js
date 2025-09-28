// documentController.js
// Controller for document upload & verification

const Document = require('../models/Document');
const cloudinary = require('../utils/cloudinary');

exports.uploadDocument = async (req, res) => {
  try {
    const { type } = req.body;
    const userId = req.user._id;
    // File upload logic (assume file in req.file)
    const result = await cloudinary.upload(req.file.path);
    const doc = new Document({
      user: userId,
      type,
      fileUrl: result.secure_url
    });
    await doc.save();
    res.status(201).json({ success: true, document: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUserDocuments = async (req, res) => {
  try {
    const userId = req.user._id;
    const docs = await Document.find({ user: userId, isDeleted: false });
    res.json({ success: true, documents: docs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.verifyDocument = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const docId = req.params.id;
    const adminId = req.user._id;
    const doc = await Document.findById(docId);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    doc.status = status;
    doc.remarks = remarks;
    doc.verifiedBy = adminId;
    doc.verifiedAt = new Date();
    await doc.save();
    res.json({ success: true, document: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const docId = req.params.id;
    const doc = await Document.findById(docId);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    doc.isDeleted = true;
    await doc.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
