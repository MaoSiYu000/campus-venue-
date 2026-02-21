import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/stores/user';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Login', component: () => import('@/views/Login.vue'), meta: { guest: true } },
    {
      path: '/user',
      component: () => import('@/layouts/UserLayout.vue'),
      meta: { role: 'user' },
      children: [
        { path: '', redirect: '/user/venue-list' },
        { path: 'profile', name: 'UserProfile', component: () => import('@/views/user/Profile.vue') },
        { path: 'change-password', name: 'UserChangePassword', component: () => import('@/views/user/ChangePassword.vue') },
        { path: 'announcements', name: 'UserAnnouncements', component: () => import('@/views/user/Announcements.vue') },
        { path: 'venue-list', name: 'VenueList', component: () => import('@/views/user/VenueList.vue') },
        { path: 'venue/:id', name: 'VenueDetail', component: () => import('@/views/user/VenueDetail.vue') },
        { path: 'booking-apply', name: 'BookingApply', component: () => import('@/views/user/BookingApply.vue') },
        { path: 'my-bookings', name: 'MyBookings', component: () => import('@/views/user/MyBookings.vue') },
      ],
    },
    {
      path: '/venue-admin',
      component: () => import('@/layouts/VenueAdminLayout.vue'),
      meta: { role: 'venue_admin' },
      children: [
        { path: '', redirect: '/venue-admin/announcements' },
        { path: 'profile', name: 'VenueAdminProfile', component: () => import('@/views/venue-admin/Profile.vue') },
        { path: 'change-password', name: 'VenueAdminChangePassword', component: () => import('@/views/venue-admin/ChangePassword.vue') },
        { path: 'announcements', name: 'VenueAdminAnnouncements', component: () => import('@/views/venue-admin/Announcements.vue') },
        { path: 'applications', name: 'ReviewApplications', component: () => import('@/views/venue-admin/ReviewApplications.vue') },
        { path: 'pending', redirect: '/venue-admin/applications' },
        { path: 'history', redirect: '/venue-admin/applications' },
        { path: 'overview', redirect: '/venue-admin/applications' },
        { path: 'venues', name: 'VenueAdminVenues', component: () => import('@/views/venue-admin/VenueManage.vue') },
      ],
    },
    {
      path: '/system-admin',
      component: () => import('@/layouts/SystemAdminLayout.vue'),
      meta: { role: 'system_admin' },
      children: [
        { path: '', redirect: '/system-admin/overview' },
        { path: 'profile', name: 'SystemAdminProfile', component: () => import('@/views/system-admin/Profile.vue') },
        { path: 'change-password', name: 'SystemAdminChangePassword', component: () => import('@/views/system-admin/ChangePassword.vue') },
        { path: 'overview', name: 'SystemOverview', component: () => import('@/views/system-admin/Overview.vue') },
        { path: 'venues', name: 'SystemVenues', component: () => import('@/views/system-admin/VenueManage.vue') },
        { path: 'accounts', name: 'AccountManage', component: () => import('@/views/system-admin/AccountManage.vue') },
        { path: 'announcements', name: 'SystemAnnouncements', component: () => import('@/views/system-admin/Announcements.vue') },
      ],
    },
  ],
});

router.beforeEach((to, _from, next) => {
  const store = useUserStore();
  if (to.meta.guest && store.isLoggedIn) {
    const r = store.role;
    if (r === 'user') {
      if (store.mustChangePassword) return next('/user/change-password?first=1');
      return next('/user/announcements');
    }
    if (r === 'venue_admin') return next('/venue-admin/announcements');
    if (r === 'system_admin') return next('/system-admin/overview');
  }
  if (to.meta.role && to.meta.role !== store.role) {
    if (!store.isLoggedIn) return next('/');
    if (store.role === 'user') return next('/user');
    if (store.role === 'venue_admin') return next('/venue-admin');
    return next('/system-admin');
  }
  if (store.role === 'user' && !store.announcementsConfirmed) {
    if (to.path !== '/user/announcements' && to.path !== '/user/change-password') return next('/user/announcements');
  }
  if (store.role === 'venue_admin' && !store.announcementsConfirmed) {
    if (to.path !== '/venue-admin/announcements') return next('/venue-admin/announcements');
  }
  next();
});

export default router;
