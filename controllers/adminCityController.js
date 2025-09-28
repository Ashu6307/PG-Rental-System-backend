import Admin from '../models/Admin.js';
import City from '../models/City.js';
import User from '../models/User.js';
import PG from '../models/PG.js';
import Flat from '../models/Flat.js';
import Inquiry from '../models/Inquiry.js';

// **CITY-WISE ADMIN MANAGEMENT SYSTEM**

// 1. Get City-wise Dashboard for Admin
export const getCityDashboard = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { city } = req.query;
    
    // Get admin details with assigned cities
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin not found' 
      });
    }
    
    // Check if admin has access to the requested city
    let targetCities = [];
    if (admin.role === 'super_admin') {
      // Super admin can access all cities
      targetCities = city ? [city] : await City.find({ isActive: true }).distinct('name');
    } else {
      // City admin can only access assigned cities
      const assignedCityNames = admin.assignedCities
        .filter(c => c.isActive)
        .map(c => c.city);
      
      if (city && !assignedCityNames.includes(city)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied for this city'
        });
      }
      
      targetCities = city ? [city] : assignedCityNames;
    }
    
    // Aggregate city-wise statistics
    const dashboardData = await Promise.all(
      targetCities.map(async (cityName) => {
        const cityStats = await getCityStatistics(cityName);
        return {
          city: cityName,
          ...cityStats
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          role: admin.role,
          assignedCities: admin.assignedCities
        },
        cities: dashboardData,
        summary: aggregateSummary(dashboardData)
      }
    });
    
  } catch (error) {
    console.error('City dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch city dashboard',
      error: error.message
    });
  }
};

// 2. Get City Statistics (Helper function)
const getCityStatistics = async (cityName) => {
  try {
    // Owner statistics
    const ownerStats = await User.aggregate([
      {
        $lookup: {
          from: 'pgs',
          localField: '_id',
          foreignField: 'owner',
          as: 'pgs'
        }
      },
      {
        $lookup: {
          from: 'flats',
          localField: '_id',
          foreignField: 'owner',
          as: 'flats'
        }
      },
      {
        $match: {
          role: 'owner',
          $or: [
            { 'pgs.city': cityName },
            { 'flats.city': cityName }
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalOwners: { $sum: 1 },
          verifiedOwners: {
            $sum: {
              $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
            }
          },
          pendingOwners: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
            }
          }
        }
      }
    ]);
    
    // Property statistics
    const pgStats = await PG.aggregate([
      { $match: { city: cityName } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRooms: { $sum: '$rooms' },
          availableRooms: { $sum: '$availableRooms' }
        }
      }
    ]);
    
    const flatStats = await Flat.aggregate([
      { $match: { city: cityName } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Inquiry statistics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const inquiryStats = await Inquiry.aggregate([
      {
        $match: {
          'property.city': cityName,
          inquiryDate: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // User statistics
    const userStats = await User.aggregate([
      {
        $lookup: {
          from: 'inquiries',
          localField: '_id',
          foreignField: 'user',
          as: 'inquiries'
        }
      },
      {
        $match: {
          role: 'user',
          'inquiries.property.city': cityName
        }
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: {
              $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
            }
          }
        }
      }
    ]);
    
    return {
      owners: ownerStats[0] || { totalOwners: 0, verifiedOwners: 0, pendingOwners: 0 },
      properties: {
        pgs: pgStats,
        flats: flatStats,
        totalProperties: pgStats.reduce((sum, item) => sum + item.count, 0) + 
                        flatStats.reduce((sum, item) => sum + item.count, 0)
      },
      inquiries: inquiryStats,
      users: userStats[0] || { totalUsers: 0, activeUsers: 0 },
      lastUpdated: new Date()
    };
    
  } catch (error) {
    console.error(`Error getting statistics for ${cityName}:`, error);
    return {
      owners: { totalOwners: 0, verifiedOwners: 0, pendingOwners: 0 },
      properties: { pgs: [], flats: [], totalProperties: 0 },
      inquiries: [],
      users: { totalUsers: 0, activeUsers: 0 },
      lastUpdated: new Date(),
      error: error.message
    };
  }
};

// 3. Aggregate Summary (Helper function)
const aggregateSummary = (cityData) => {
  return cityData.reduce((summary, city) => {
    summary.totalCities += 1;
    summary.totalOwners += city.owners.totalOwners;
    summary.totalProperties += city.properties.totalProperties;
    summary.totalInquiries += city.inquiries.reduce((sum, item) => sum + item.count, 0);
    summary.totalUsers += city.users.totalUsers;
    return summary;
  }, {
    totalCities: 0,
    totalOwners: 0,
    totalProperties: 0,
    totalInquiries: 0,
    totalUsers: 0
  });
};

// 4. Get City-wise Pending Approvals
export const getCityPendingApprovals = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { city } = req.query;
    
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin not found' 
      });
    }
    
    // Check city access
    let targetCities = [];
    if (admin.role === 'super_admin') {
      targetCities = city ? [city] : await City.find({ isActive: true }).distinct('name');
    } else {
      const assignedCityNames = admin.assignedCities
        .filter(c => c.isActive)
        .map(c => c.city);
      
      if (city && !assignedCityNames.includes(city)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied for this city'
        });
      }
      
      targetCities = city ? [city] : assignedCityNames;
    }
    
    // Get pending approvals for target cities
    const pendingData = await Promise.all(
      targetCities.map(async (cityName) => {
        // Pending owners
        const pendingOwners = await User.aggregate([
          {
            $lookup: {
              from: 'pgs',
              localField: '_id',
              foreignField: 'owner',
              as: 'pgs'
            }
          },
          {
            $lookup: {
              from: 'flats',
              localField: '_id',
              foreignField: 'owner',
              as: 'flats'
            }
          },
          {
            $match: {
              role: 'owner',
              status: 'pending',
              $or: [
                { 'pgs.city': cityName },
                { 'flats.city': cityName }
              ]
            }
          },
          {
            $project: {
              name: 1,
              email: 1,
              phone: 1,
              created_at: 1,
              totalProperties: { 
                $add: [
                  { $size: '$pgs' },
                  { $size: '$flats' }
                ]
              }
            }
          }
        ]);
        
        // Pending properties
        const pendingPGs = await PG.find({ 
          city: cityName, 
          status: 'pending' 
        }).populate('owner', 'name email').limit(10);
        
        const pendingFlats = await Flat.find({ 
          city: cityName, 
          status: 'pending' 
        }).populate('owner', 'name email').limit(10);
        
        // Pending inquiries
        const pendingInquiries = await Inquiry.find({
          'property.city': cityName,
          assignedAdmin: adminId,
          status: { $in: ['pending', 'admin_processing'] }
        }).populate('user owner', 'name email phone').limit(10);
        
        return {
          city: cityName,
          pendingOwners,
          pendingProperties: {
            pgs: pendingPGs,
            flats: pendingFlats
          },
          pendingInquiries,
          counts: {
            owners: pendingOwners.length,
            properties: pendingPGs.length + pendingFlats.length,
            inquiries: pendingInquiries.length
          }
        };
      })
    );
    
    res.json({
      success: true,
      data: pendingData,
      summary: {
        totalPendingOwners: pendingData.reduce((sum, city) => sum + city.counts.owners, 0),
        totalPendingProperties: pendingData.reduce((sum, city) => sum + city.counts.properties, 0),
        totalPendingInquiries: pendingData.reduce((sum, city) => sum + city.counts.inquiries, 0)
      }
    });
    
  } catch (error) {
    console.error('Pending approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending approvals',
      error: error.message
    });
  }
};

// 5. Assign City to Admin (Super Admin only)
export const assignCityToAdmin = async (req, res) => {
  try {
    const { adminId, city, state } = req.body;
    
    // Check if requesting user is super admin
    const requestingAdmin = await Admin.findById(req.user.id);
    if (requestingAdmin.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can assign cities'
      });
    }
    
    // Find target admin
    const targetAdmin = await Admin.findById(adminId);
    if (!targetAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    // Check if city already assigned
    const existingAssignment = targetAdmin.assignedCities.find(
      c => c.city === city && c.isActive
    );
    
    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: 'City already assigned to this admin'
      });
    }
    
    // Add city assignment
    targetAdmin.assignedCities.push({
      city,
      state,
      isActive: true,
      assignedDate: new Date()
    });
    
    await targetAdmin.save();
    
    // Update city record
    await City.findOneAndUpdate(
      { name: city },
      { 
        assignedAdmin: adminId,
        adminAssignedDate: new Date()
      }
    );
    
    res.json({
      success: true,
      message: 'City assigned successfully',
      data: {
        admin: targetAdmin.name,
        city,
        assignedDate: new Date()
      }
    });
    
  } catch (error) {
    console.error('City assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign city',
      error: error.message
    });
  }
};

// 6. Get All Cities for Super Admin
export const getAllCitiesForSuperAdmin = async (req, res) => {
  try {
    const requestingAdmin = await Admin.findById(req.user.id);
    if (requestingAdmin.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Super admin access required'
      });
    }
    
    const cities = await City.find({ isActive: true })
      .populate('assignedAdmin', 'name email role')
      .sort({ name: 1 });
    
    const citiesWithStats = await Promise.all(
      cities.map(async (city) => {
        const stats = await getCityStatistics(city.name);
        return {
          ...city.toObject(),
          stats
        };
      })
    );
    
    res.json({
      success: true,
      data: citiesWithStats
    });
    
  } catch (error) {
    console.error('Get cities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cities',
      error: error.message
    });
  }
};

// 7. Create New City (Super Admin only)
export const createNewCity = async (req, res) => {
  try {
    const requestingAdmin = await Admin.findById(req.user.id);
    if (requestingAdmin.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can create cities'
      });
    }
    
    const { name, state, description, image } = req.body;
    
    // Check if city already exists
    const existingCity = await City.findOne({ name: name.toLowerCase() });
    if (existingCity) {
      return res.status(400).json({
        success: false,
        message: 'City already exists'
      });
    }
    
    // Create new city
    const newCity = new City({
      name: name.toLowerCase(),
      state,
      description,
      image,
      isActive: true,
      isNewCity: true
    });
    
    await newCity.save();
    
    res.json({
      success: true,
      message: 'City created successfully',
      data: newCity
    });
    
  } catch (error) {
    console.error('Create city error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create city',
      error: error.message
    });
  }
};

// 8. Get Admin's Assigned Cities
export const getAdminAssignedCities = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    if (admin.role === 'super_admin') {
      // Super admin can see all cities
      const allCities = await City.find({ isActive: true })
        .populate('assignedAdmin', 'name email')
        .sort({ name: 1 });
      
      res.json({
        success: true,
        data: allCities,
        adminRole: 'super_admin'
      });
    } else {
      // City admin can only see assigned cities
      const assignedCityNames = admin.assignedCities
        .filter(c => c.isActive)
        .map(c => c.city);
      
      const assignedCities = await City.find({ 
        name: { $in: assignedCityNames },
        isActive: true 
      }).sort({ name: 1 });
      
      res.json({
        success: true,
        data: assignedCities,
        adminRole: 'city_admin',
        assignedCities: admin.assignedCities
      });
    }
    
  } catch (error) {
    console.error('Get assigned cities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned cities',
      error: error.message
    });
  }
};
