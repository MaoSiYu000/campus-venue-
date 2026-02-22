<template>
  <el-container class="layout">
    <el-header class="header">
      <span class="title">校园场地预约系统 - 系统管理员</span>
      <div class="nav-right">
        <router-link to="/system-admin/overview" class="tab" :class="{ active: activeMenu === '/system-admin/overview' }">预约总览</router-link>
        <router-link to="/system-admin/venues" class="tab" :class="{ active: activeMenu === '/system-admin/venues' }">场地管理</router-link>
        <router-link to="/system-admin/accounts" class="tab" :class="{ active: activeMenu === '/system-admin/accounts' }">账号管理</router-link>
        <router-link to="/system-admin/announcements" class="tab" :class="{ active: activeMenu === '/system-admin/announcements' }">发布公告</router-link>
        <router-link to="/system-admin/profile" class="tab" :class="{ active: activeMenu === '/system-admin/profile' }">个人主页</router-link>
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
  position: relative;
  z-index: 10;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.18);
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
  position: relative;
  border-bottom: 3px solid transparent;
  box-sizing: border-box;
}
.nav-right .tab:hover {
  background: rgba(255,255,255,0.1);
  border-bottom-color: rgba(255,255,255,0.8);
}
.el-main { padding: 20px; background: #f5f7fa; }
</style>
