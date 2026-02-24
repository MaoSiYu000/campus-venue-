<template>
  <el-container class="layout">
    <el-header class="header">
      <span class="title">校园场地预约系统 - 学生/老师</span>
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
.layout { height: 100%; flex-direction: column; min-height: 100vh; }
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
  min-height: calc(100vh - 90px);
  flex: 1;
}
.el-main.no-scroll {
  overflow: hidden;
  height: calc(100vh - 90px);
}
</style>
