<template>
  <el-container class="layout">
    <el-header class="header">
      <span class="title">学生/老师</span>
      <div class="nav-right">
        <router-link to="/user/venue-list" class="tab" :class="{ active: activeMenu === '/user/venue-list' }">场地列表</router-link>
        <router-link to="/user/booking-apply" class="tab" :class="{ active: activeMenu === '/user/booking-apply' }">预约申请</router-link>
        <router-link to="/user/my-bookings" class="tab" :class="{ active: activeMenu === '/user/my-bookings' }">我的预约</router-link>
        <router-link to="/user/announcements" class="tab" :class="{ active: activeMenu === '/user/announcements' }">公告</router-link>
        <router-link to="/user/profile" class="tab" :class="{ active: activeMenu === '/user/profile' }">个人主页</router-link>
      </div>
    </el-header>
    <el-main :class="{ 'no-scroll': activeMenu === '/user/announcements' || activeMenu === '/user/profile' }">
      <router-view />
    </el-main>
    <el-footer class="page-footer">校园场地预约系统</el-footer>
  </el-container>
</template>

<script setup lang="ts">
import { computed, watch, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const activeMenu = computed(() => route.path);

const noScrollPaths = ['/user/announcements', '/user/profile'];
watch(activeMenu, (path) => {
  document.body.style.overflow = noScrollPaths.includes(path) ? 'hidden' : '';
}, { immediate: true });
onBeforeUnmount(() => { document.body.style.overflow = ''; });
</script>

<style scoped>
.layout { height: 100vh; flex-direction: column; overflow: hidden; }
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 90px;
  background: #325ba7;
  color: #fff;
  position: relative;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.title { margin-right: auto; font-weight: bold; flex-shrink: 0; font-size: 24px; }
.nav-right {
  display: flex;
  align-items: center;
  gap: 0;
  flex-shrink: 0;
}
.nav-right .tab {
  padding: 0 16px;
  height: 90px;
  line-height: 90px;
  color: #fff;
  text-decoration: none;
  font-size: 21px;
  white-space: nowrap;
  position: relative;
  border-bottom: 3px solid transparent;
  box-sizing: border-box;
}
.nav-right .tab:hover {
  background: rgba(255,255,255,0.1);
  border-bottom-color: rgba(255,255,255,0.8);
}
.el-main {
  padding: 20px;
  background: url('/images/背景2.jpg') center center / cover no-repeat;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
.el-main.no-scroll {
  overflow: hidden;
}
.page-footer {
  height: calc(100vh / 32);
  min-height: 24px;
  flex-shrink: 0;
  background: #325ba7;
  color: #fff;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}
</style>
