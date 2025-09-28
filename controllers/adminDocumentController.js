// adminDocumentController.js
// Controller for admin document verification (industry-level)

const Document = require('../models/Document');

exports.listDocuments = async (req, res) => {
  try {
    const { status, user } = req.query;
    let query = { isDeleted: false };
    if (status) query.status = status;
    if (user) query.user = user;
    const documents = await Document.find(query).populate('user verifiedBy');
    res.json({ success: true, documents });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.verifyDocument = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const doc = await Document.findById(req.params.id);
    if (!doc || doc.isDeleted) return res.status(404).json({ success: false, message: 'Document not found' });
    doc.status = status;
    doc.remarks = remarks;
    doc.verifiedBy = req.user._id;
    doc.verifiedAt = new Date();
    await doc.save();
    res.json({ success: true, document: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
