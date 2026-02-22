<template>
  <el-container class="layout">
    <el-header class="header">
      <span class="title">校园场地预约系统 - 场地管理员</span>
      <div class="nav-right">
        <router-link to="/venue-admin/applications" class="tab" :class="{ active: activeMenu === '/venue-admin/applications' }">审核申请</router-link>
        <router-link to="/venue-admin/overview" class="tab" :class="{ active: activeMenu === '/venue-admin/overview' }">预约总览</router-link>
        <router-link to="/venue-admin/venues" class="tab" :class="{ active: activeMenu === '/venue-admin/venues' }">场地管理</router-link>
        <router-link to="/venue-admin/announcements" class="tab" :class="{ active: activeMenu === '/venue-admin/announcements' }">公告</router-link>
        <router-link to="/venue-admin/profile" class="tab" :class="{ active: activeMenu === '/venue-admin/profile' }">个人主页</router-link>
      </div>
    </el-header>
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const activeMenu = computed(() => route.path);
</script>

<style scoped>
.layout { height: 100%; flex-direction: column; }
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #1e3a5f;
  color: #fff;
}
.title { margin-right: auto; font-weight: bold; flex-shrink: 0; }
.nav-right {
  display: flex;
  align-items: center;
  gap: 0;
  flex-shrink: 0;
}
.nav-right .tab {
  padding: 0 16px;
  height: 60px;
  line-height: 60px;
  color: #fff;
  text-decoration: none;
  font-size: 14px;
  white-space: nowrap;
}
.nav-right .tab:hover { background: rgba(255,255,255,0.1); }
.nav-right .tab.active { background: rgba(255,255,255,0.15); font-weight: 500; }
.el-main { padding: 20px; background: #f5f7fa; }
</style>
