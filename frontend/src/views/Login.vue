<template>
  <div class="login-page">
    <div class="login-card">
      <h1>校园场地预约系统</h1>
      <el-form :model="form" label-width="80px" @submit.prevent="onSubmit">
        <el-form-item label="身份">
          <el-select v-model="form.role" placeholder="请选择" style="width: 100%">
            <el-option label="学生/老师" value="user" />
            <el-option label="场地管理员" value="venue_admin" />
            <el-option label="系统管理员" value="system_admin" />
          </el-select>
        </el-form-item>
        <el-form-item :label="accountLabel">
          <el-input v-model="form.account" :placeholder="accountPlaceholder" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" style="width: 100%" @click="onSubmit">登录</el-button>
        </el-form-item>
      </el-form>
      <p class="tips">测试：学生 2024001 / 场地管理员 va001 / 系统管理员 admin，密码 123456；超管首次请执行 seed 后使用 admin123</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';
import { login } from '@/api/auth';

const router = useRouter();
const store = useUserStore();
const loading = ref(false);
const form = ref({
  role: 'user' as 'user' | 'venue_admin' | 'system_admin',
  account: '',
  password: '',
});

const accountLabel = computed(() => {
  if (form.value.role === 'user') return '学号';
  if (form.value.role === 'venue_admin') return '工号';
  return '用户名';
});

const accountPlaceholder = computed(() => {
  if (form.value.role === 'user') return '请输入学号';
  if (form.value.role === 'venue_admin') return '请输入工号';
  return '请输入用户名';
});

async function onSubmit() {
  if (!form.value.account || !form.value.password) {
    ElMessage.warning('请填写完整');
    return;
  }
  loading.value = true;
  try {
    const data = await login(form.value.role, form.value.account, form.value.password);
    const payload = (data as any)?.data ?? data;
    store.setLogin(payload);
    await nextTick();
    const role = payload?.role ?? (data as any)?.role;
    if (role === 'user') {
      if (payload?.mustChangePassword) router.replace('/user/change-password');
      else router.replace('/user/announcements');
    } else if (role === 'venue_admin') {
      router.replace('/venue-admin/announcements');
    } else {
      router.replace('/system-admin/overview');
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '登录失败');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
}
.login-card {
  width: 400px;
  padding: 32px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}
.login-card h1 {
  text-align: center;
  margin-bottom: 24px;
  font-size: 22px;
  color: #1e3a5f;
}
.tips {
  font-size: 12px;
  color: #888;
  margin-top: 16px;
}
</style>
