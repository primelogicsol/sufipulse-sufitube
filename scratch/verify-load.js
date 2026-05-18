try {
  const DashboardLayout = require('./app/components/layout/DashboardLayout');
  console.log('DashboardLayout loaded');
} catch (e) {
  console.error('DashboardLayout failed to load:', e.message);
}
