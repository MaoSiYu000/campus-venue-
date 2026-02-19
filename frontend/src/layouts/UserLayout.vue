<template>
  <el-container class="layout">
    <el-header class="header">
      <span class="title">校园场地预约系统 - 学生/老师</span>
      <el-menu mode="horizontal" :default-active="activeMenu" router>
        <el-menu-item index="/user/venue-list">场地列表</el-menu-item>
        <el-menu-item index="/user/booking-apply">预约申请</el-menu-item>
        <el-menu-item index="/user/my-bookings">我的预约</el-menu-item>
        <el-menu-item index="/user/announcements">公告</el-menu-item>
        <el-menu-item index="/user/profile">个人主页</el-menu-item>
        <el-button type="danger" link @click="logout">退出</el-button>
      </el-menu>
    </el-header>
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';

const route = useRoute();
const router = useRouter();
const store = useUserStore();

const activeMenu = computed(() => route.path);

function logout() {
  store.logout();
  router.push('/');
}
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
.title { margin-right: 24px; font-weight: bold; }
.header .el-menu { background: transparent; border: none; }
.header .el-menu-item { color: #fff; }
.header .el-menu-item:hover { background: rgba(255,255,255,0.1); }
.el-main { padding: 20px; background: #f5f7fa; }
</style>
