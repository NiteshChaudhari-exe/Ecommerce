/**
 * Scheduled Tasks Service
 * 
 * Runs background jobs at regular intervals:
 * - Low-stock monitoring (check all products, alert if below threshold)
 * - Reservation cleanup (remove expired holds)
 */

const { checkAllProductsAndAlert } = require('./lowStockAlertService');
const { cleanupExpiredReservations } = require('./reservationService');

let intervalHandles = [];

function startScheduledTasks() {
  console.log('[ScheduledTasks] Starting scheduled background jobs...');

  // Low-stock check every 1 hour
  const lowStockInterval = setInterval(async () => {
    try {
      console.log('[ScheduledTasks] Running low-stock check...');
      const alerts = await checkAllProductsAndAlert();
      if (alerts.length > 0) {
        console.log(`[ScheduledTasks] Found ${alerts.length} low-stock products`);
      }
    } catch (err) {
      console.error('[ScheduledTasks] Low-stock check failed:', err.message);
    }
  }, 60 * 60 * 1000); // 1 hour

  // Reservation cleanup every 30 minutes
  const reservationInterval = setInterval(async () => {
    try {
      console.log('[ScheduledTasks] Running reservation cleanup...');
      const cleaned = await cleanupExpiredReservations();
      if (cleaned > 0) {
        console.log(`[ScheduledTasks] Cleaned up ${cleaned} expired reservations`);
      }
    } catch (err) {
      console.error('[ScheduledTasks] Reservation cleanup failed:', err.message);
    }
  }, 30 * 60 * 1000); // 30 minutes

  intervalHandles.push(lowStockInterval, reservationInterval);
  console.log('[ScheduledTasks] Background jobs started successfully');
}

function stopScheduledTasks() {
  console.log('[ScheduledTasks] Stopping scheduled background jobs...');
  intervalHandles.forEach(handle => clearInterval(handle));
  intervalHandles = [];
  console.log('[ScheduledTasks] Background jobs stopped');
}

module.exports = {
  startScheduledTasks,
  stopScheduledTasks,
};
