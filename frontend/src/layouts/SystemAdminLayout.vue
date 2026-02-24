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
  min-height: calc(100vh - 90px);
  flex: 1;
}
</style>
