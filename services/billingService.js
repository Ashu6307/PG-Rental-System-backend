import PGResident from '../models/PGResident.js';
import Invoice from '../models/Invoice.js';
import Room from '../models/Room.js';
import PG from '../models/PG.js';

/**
 * Calculate anniversary-based billing for a tenant
 * @param {Object} resident - PGResident document
 * @returns {Object} Billing calculation result
 */
export async function calculateAnniversaryBilling(resident) {
  try {
    if (!resident.checkinDate || !resident.rentAmount) {
      throw new Error('Missing required billing information');
    }

    const today = new Date();
    const anniversaryDate = new Date(resident.checkinDate);
    anniversaryDate.setFullYear(today.getFullYear());
    anniversaryDate.setMonth(today.getMonth());

    // If anniversary has passed this month, use next month
    if (anniversaryDate < today) {
      anniversaryDate.setMonth(anniversaryDate.getMonth() + 1);
    }

    const billingPeriodStart = new Date(anniversaryDate);
    const billingPeriodEnd = new Date(anniversaryDate);
    billingPeriodEnd.setMonth(billingPeriodEnd.getMonth() + 1);
    billingPeriodEnd.setDate(billingPeriodEnd.getDate() - 1);

    // Calculate base rent
    let totalAmount = resident.rentAmount;
    const items = [
      {
        description: 'Monthly Rent',
        amount: resident.rentAmount,
        type: 'rent'
      }
    ];

    // Add electricity charges if applicable
    const electricityAmount = await calculateElectricityCharges(resident);
    if (electricityAmount > 0) {
      items.push({
        description: 'Electricity Charges',
        amount: electricityAmount,
        type: 'electricity'
      });
      totalAmount += electricityAmount;
    }

    // Add common charges if applicable
    const commonCharges = await calculateCommonCharges(resident);
    if (commonCharges > 0) {
      items.push({
        description: 'Common Area Charges',
        amount: commonCharges,
        type: 'common_charges'
      });
      totalAmount += commonCharges;
    }

    // Apply any discounts or adjustments
    const adjustments = await calculateAdjustments(resident);
    if (adjustments.length > 0) {
      adjustments.forEach(adj => {
        items.push(adj);
        totalAmount += adj.amount; // Can be negative for discounts
      });
    }

    return {
      totalAmount: Math.max(0, totalAmount), // Ensure non-negative
      items,
      billingPeriod: {
        start: billingPeriodStart,
        end: billingPeriodEnd
      },
      dueDate: new Date(anniversaryDate.getTime() + (7 * 24 * 60 * 60 * 1000)), // 7 days after anniversary
      metadata: {
        anniversaryDate: resident.checkinDate,
        billingType: 'anniversary',
        calculatedAt: new Date()
      }
    };
  } catch (error) {
    console.error('Error calculating anniversary billing:', error);
    throw error;
  }
}

/**
 * Calculate prorated amount for partial month stays
 * @param {Object} resident - PGResident document
 * @param {Date} startDate - Start date of billing period
 * @param {Date} endDate - End date of billing period
 * @returns {Object} Prorated billing calculation
 */
export function calculateProratedAmount(resident, startDate, endDate) {
  try {
    if (!resident.rentAmount || !startDate || !endDate) {
      throw new Error('Missing required parameters for proration');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysInPeriod = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Get total days in the month
    const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
    const monthEnd = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    const totalDaysInMonth = monthEnd.getDate();

    let proratedAmount;
    const items = [];

    if (resident.proration.prorationType === 'daily') {
      const dailyRate = resident.rentAmount / totalDaysInMonth;
      proratedAmount = Math.round(dailyRate * daysInPeriod);
      
      items.push({
        description: `Prorated Rent (${daysInPeriod} days of ${totalDaysInMonth})`,
        amount: proratedAmount,
        type: 'rent',
        calculation: {
          dailyRate: Math.round(dailyRate * 100) / 100,
          days: daysInPeriod,
          totalDays: totalDaysInMonth
        }
      });
    } else {
      // Weekly proration
      const weeksInPeriod = Math.ceil(daysInPeriod / 7);
      const weeklyRate = resident.rentAmount / 4; // Assuming 4 weeks per month
      proratedAmount = Math.round(weeklyRate * weeksInPeriod);
      
      items.push({
        description: `Prorated Rent (${weeksInPeriod} weeks)`,
        amount: proratedAmount,
        type: 'rent',
        calculation: {
          weeklyRate: Math.round(weeklyRate * 100) / 100,
          weeks: weeksInPeriod,
          days: daysInPeriod
        }
      });
    }

    return {
      totalAmount: proratedAmount,
      items,
      billingPeriod: {
        start: start,
        end: end
      },
      metadata: {
        proration: true,
        prorationType: resident.proration.prorationType,
        daysInPeriod,
        totalDaysInMonth,
        calculatedAt: new Date()
      }
    };
  } catch (error) {
    console.error('Error calculating prorated amount:', error);
    throw error;
  }
}

/**
 * Calculate next billing date based on resident's anniversary
 * @param {Object} resident - PGResident document
 * @returns {Date} Next billing date
 */
export function calculateNextBillingDate(resident) {
  try {
    if (!resident.checkinDate) {
      throw new Error('Check-in date is required to calculate billing date');
    }

    const today = new Date();
    const anniversaryDay = resident.checkinDate.getDate();
    
    // Start with current month, same day as anniversary
    let nextBilling = new Date(today.getFullYear(), today.getMonth(), anniversaryDay);
    
    // If the date has passed this month, move to next month
    if (nextBilling <= today) {
      nextBilling.setMonth(nextBilling.getMonth() + 1);
    }
    
    // Handle month-end edge cases (e.g., joined on 31st but next month has only 30 days)
    if (nextBilling.getDate() !== anniversaryDay) {
      // If the desired day doesn't exist in the target month, use the last day of the month
      nextBilling = new Date(nextBilling.getFullYear(), nextBilling.getMonth() + 1, 0);
    }

    return nextBilling;
  } catch (error) {
    console.error('Error calculating next billing date:', error);
    throw error;
  }
}

/**
 * Calculate electricity charges for a resident
 * @param {Object} resident - PGResident document
 * @returns {number} Electricity charges amount
 */
async function calculateElectricityCharges(resident) {
  try {
    // This would integrate with your existing ElectricityBill model
    // For now, returning a calculated amount based on room and usage
    
    const room = await Room.findById(resident.room);
    if (!room) return 0;

    // Base electricity charge per room
    const baseCharge = 200;
    
    // Additional charges based on room type
    const roomTypeMultiplier = {
      'single': 1.0,
      'double': 1.5,
      'triple': 2.0,
      'quad': 2.5
    };
    
    const multiplier = roomTypeMultiplier[room.type] || 1.0;
    const calculatedAmount = Math.round(baseCharge * multiplier);
    
    return calculatedAmount;
  } catch (error) {
    console.error('Error calculating electricity charges:', error);
    return 0;
  }
}

/**
 * Calculate common area charges
 * @param {Object} resident - PGResident document
 * @returns {number} Common charges amount
 */
async function calculateCommonCharges(resident) {
  try {
    const pg = await PG.findById(resident.pg);
    if (!pg || !pg.commonCharges) return 0;
    
    return pg.commonCharges || 0;
  } catch (error) {
    console.error('Error calculating common charges:', error);
    return 0;
  }
}

/**
 * Calculate any adjustments (discounts, penalties, etc.)
 * @param {Object} resident - PGResident document
 * @returns {Array} Array of adjustment items
 */
async function calculateAdjustments(resident) {
  try {
    const adjustments = [];
    
    // Long-term tenant discount
    if (resident.tenancyDuration >= 12) {
      adjustments.push({
        description: 'Long-term Tenant Discount (5%)',
        amount: -Math.round(resident.rentAmount * 0.05),
        type: 'discount'
      });
    }
    
    // Early payment discount (if paid within 3 days of due date)
    const lastBill = resident.getLastBill?.();
    if (lastBill && lastBill.paidDate) {
      const daysEarly = Math.ceil((lastBill.dueDate - lastBill.paidDate) / (1000 * 60 * 60 * 24));
      if (daysEarly >= 0) {
        adjustments.push({
          description: 'Early Payment Discount (2%)',
          amount: -Math.round(resident.rentAmount * 0.02),
          type: 'discount'
        });
      }
    }
    
    // Late payment penalty (if previous bills are overdue)
    const overdueBills = resident.billingHistory?.filter(bill => 
      bill.status === 'overdue' || 
      (bill.status === 'pending' && bill.dueDate < new Date())
    ) || [];
    
    if (overdueBills.length > 0) {
      const totalOverdue = overdueBills.reduce((sum, bill) => sum + bill.amount, 0);
      const penalty = Math.round(totalOverdue * 0.02); // 2% penalty
      adjustments.push({
        description: `Late Payment Penalty (2% on ₹${totalOverdue})`,
        amount: penalty,
        type: 'penalty'
      });
    }
    
    return adjustments;
  } catch (error) {
    console.error('Error calculating adjustments:', error);
    return [];
  }
}

/**
 * Generate billing cycle for a resident
 * @param {Object} resident - PGResident document
 * @param {number} months - Number of months to generate
 * @returns {Array} Array of billing periods
 */
export function generateBillingCycle(resident, months = 12) {
  try {
    const cycles = [];
    let currentDate = new Date(resident.checkinDate);
    
    for (let i = 0; i < months; i++) {
      const cycleStart = new Date(currentDate);
      const cycleEnd = new Date(currentDate);
      cycleEnd.setMonth(cycleEnd.getMonth() + 1);
      cycleEnd.setDate(cycleEnd.getDate() - 1);
      
      cycles.push({
        cycle: i + 1,
        start: cycleStart,
        end: cycleEnd,
        dueDate: new Date(cycleStart.getTime() + (7 * 24 * 60 * 60 * 1000)),
        amount: resident.rentAmount,
        anniversaryDate: currentDate.getDate()
      });
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return cycles;
  } catch (error) {
    console.error('Error generating billing cycle:', error);
    throw error;
  }
}

/**
 * Calculate billing summary for a resident
 * @param {string} residentId - Resident ID
 * @param {Date} fromDate - Start date for summary
 * @param {Date} toDate - End date for summary
 * @returns {Object} Billing summary
 */
export async function calculateBillingSummary(residentId, fromDate, toDate) {
  try {
    const resident = await PGResident.findById(residentId);
    if (!resident) {
      throw new Error('Resident not found');
    }

    const invoices = await Invoice.find({
      tenantId: residentId,
      createdAt: { $gte: fromDate, $lte: toDate }
    });

    const summary = {
      totalInvoices: invoices.length,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      invoicesByType: {},
      paymentStatus: {
        paid: 0,
        pending: 0,
        overdue: 0
      }
    };

    invoices.forEach(invoice => {
      summary.totalAmount += invoice.amount;
      
      // Group by type
      if (!summary.invoicesByType[invoice.type]) {
        summary.invoicesByType[invoice.type] = {
          count: 0,
          amount: 0
        };
      }
      summary.invoicesByType[invoice.type].count++;
      summary.invoicesByType[invoice.type].amount += invoice.amount;
      
      // Calculate by status
      if (invoice.status === 'paid') {
        summary.paidAmount += invoice.amount;
        summary.paymentStatus.paid++;
      } else if (invoice.status === 'pending') {
        if (invoice.dueDate < new Date()) {
          summary.overdueAmount += invoice.amount;
          summary.paymentStatus.overdue++;
        } else {
          summary.pendingAmount += invoice.amount;
          summary.paymentStatus.pending++;
        }
      }
    });

    summary.averageAmount = summary.totalInvoices > 0 ? 
      Math.round(summary.totalAmount / summary.totalInvoices) : 0;
    
    summary.paymentPercentage = summary.totalAmount > 0 ? 
      Math.round((summary.paidAmount / summary.totalAmount) * 100) : 0;

    return summary;
  } catch (error) {
    console.error('Error calculating billing summary:', error);
    throw error;
  }
}

/**
 * Handle mid-month tenant lifecycle changes
 * @param {Object} resident - PGResident document
 * @param {string} action - 'checkin' or 'checkout'
 * @param {Date} actionDate - Date of the action
 * @returns {Object} Billing adjustment calculation
 */
export async function handleMidMonthBilling(resident, action, actionDate) {
  try {
    const today = new Date(actionDate || Date.now());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    let billingResult;

    if (action === 'checkin') {
      // Calculate prorated amount from checkin date to month end
      billingResult = calculateProratedAmount(resident, today, monthEnd);
      billingResult.description = 'Prorated rent for partial month (Check-in)';
    } else if (action === 'checkout') {
      // Calculate prorated amount from month start to checkout date
      billingResult = calculateProratedAmount(resident, monthStart, today);
      billingResult.description = 'Prorated rent for partial month (Check-out)';
    }

    return {
      ...billingResult,
      metadata: {
        ...billingResult.metadata,
        action,
        actionDate: today,
        isPartialMonth: true
      }
    };
  } catch (error) {
    console.error('Error handling mid-month billing:', error);
    throw error;
  }
}

export default {
  calculateAnniversaryBilling,
  calculateProratedAmount,
  calculateNextBillingDate,
  generateBillingCycle,
  calculateBillingSummary,
  handleMidMonthBilling
};