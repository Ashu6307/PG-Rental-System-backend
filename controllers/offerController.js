import Offer from '../models/Offer.js';

export const getOffers = async (req, res) => {
  try {
    const { type, active, page = 1, limit = 10 } = req.query;
    
    // Build filter criteria
    const filter = {};
    
    if (type && ['pg', 'room', 'both'].includes(type)) {
      filter.type = type;
    }
    
    if (active !== undefined) {
      filter.isActive = active === 'true';
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get offers with pagination
    const offers = await Offer.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');
    
    // Get total count for pagination
    const total = await Offer.countDocuments(filter);
    
    res.json({
      success: true,
      offers,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: offers.length,
        totalCount: total
      }
    });
  } catch (err) {
    console.error('Error fetching offers:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch offers',
      message: err.message 
    });
  }
};

export const createOffer = async (req, res) => {
  try {
    const { 
      title, 
      name, 
      description, 
      discount, 
      validUntil, 
      type = 'both', 
      images, 
      imageUrl 
    } = req.body;
    
    // Validation
    if (!title && !name) {
      return res.status(400).json({
        success: false,
        error: 'Title or name is required'
      });
    }
    
    if (!description) {
      return res.status(400).json({
        success: false,
        error: 'Description is required'
      });
    }
    
    if (!discount) {
      return res.status(400).json({
        success: false,
        error: 'Discount is required'
      });
    }
    
    if (!validUntil) {
      return res.status(400).json({
        success: false,
        error: 'Valid until date is required'
      });
    }
    
    const offer = new Offer({ 
      title: title || name,
      name: name || title,
      description, 
      discount,
      validUntil: new Date(validUntil),
      type,
      images: images || [],
      imageUrl,
      createdBy: req.adminId || req.user?.id
    });
    
    await offer.save();
    
    res.status(201).json({
      success: true,
      offer,
      message: 'Offer created successfully'
    });
  } catch (err) {
    console.error('Error creating offer:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create offer',
      message: err.message 
    });
  }
};

export const updateOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title,
      name, 
      description, 
      discount,
      validUntil,
      type,
      images, 
      imageUrl,
      isActive 
    } = req.body;
    
    const updateData = {
      updatedAt: new Date()
    };
    
    if (title !== undefined) updateData.title = title;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (discount !== undefined) updateData.discount = discount;
    if (validUntil !== undefined) updateData.validUntil = new Date(validUntil);
    if (type !== undefined) updateData.type = type;
    if (images !== undefined) updateData.images = images;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const offer = await Offer.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        error: 'Offer not found'
      });
    }
    
    res.json({
      success: true,
      offer,
      message: 'Offer updated successfully'
    });
  } catch (err) {
    console.error('Error updating offer:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update offer',
      message: err.message 
    });
  }
};

export const deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;
    
    const offer = await Offer.findByIdAndDelete(id);
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        error: 'Offer not found'
      });
    }
    
    res.json({ 
      success: true,
      message: 'Offer deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting offer:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete offer',
      message: err.message 
    });
  }
};

export const getOfferById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const offer = await Offer.findById(id).select('-__v');
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        error: 'Offer not found'
      });
    }
    
    res.json({
      success: true,
      offer
    });
  } catch (err) {
    console.error('Error fetching offer:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch offer',
      message: err.message 
    });
  }
};
