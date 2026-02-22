<template>
  <div class="page">
    <el-card style="max-width: 480px; margin: 40px auto">
      <template #header>修改密码</template>
      <el-form :model="form" label-width="100px" @submit.prevent="submit">
        <el-form-item label="原密码">
          <el-input v-model="form.oldPassword" type="password" placeholder="当前密码" show-password />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="form.newPassword" type="password" placeholder="至少6位" show-password />
        </el-form-item>
        <el-form-item label="确认新密码">
          <el-input v-model="form.confirm" type="password" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="submit" class="btn-fixed">确认修改</el-button>
          <el-button @click="router.push('/venue-admin/profile')" class="btn-fixed">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { changePassword } from '@/api/auth';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const store = useUserStore();
const loading = ref(false);
const form = ref({ oldPassword: '', newPassword: '', confirm: '' });

async function submit() {
  if (form.value.newPassword.length < 6) {
    ElMessage.warning('新密码至少6位');
    return;
  }
  if (form.value.newPassword !== form.value.confirm) {
    ElMessage.warning('两次输入的新密码不一致');
    return;
  }
  loading.value = true;
  try {
    await changePassword(form.value.oldPassword, form.value.newPassword);
    ElMessage.success('修改成功，请重新登录');
    store.logout();
    router.push('/');
  } catch (e: any) {
    ElMessage.error(e?.message || '修改失败');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.page { min-height: 60vh; }
.btn-fixed { min-width: 100px; }
</style>
