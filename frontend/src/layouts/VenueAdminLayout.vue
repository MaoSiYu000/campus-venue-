<template>
  <el-container class="layout">
    <el-header class="header">
      <span class="title">校园场地预约系统 - 场地管理员</span>
      <el-menu mode="horizontal" :default-active="activeMenu" router>
        <el-menu-item index="/venue-admin/applications">审核申请</el-menu-item>
        <el-menu-item index="/venue-admin/venues">场地管理</el-menu-item>
        <el-menu-item index="/venue-admin/announcements">公告</el-menu-item>
        <el-menu-item index="/venue-admin/profile">个人主页</el-menu-item>
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
.el-main { padding: 20px; background: #f5f7fa; }
</style>
