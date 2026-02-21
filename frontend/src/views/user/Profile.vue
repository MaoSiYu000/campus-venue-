<template>
  <div class="page profile-page">
    <h2>个人主页</h2>
    <el-card class="profile-card">
      <div class="profile-header">
        <el-avatar :size="72" :src="avatarUrl" class="avatar">
          {{ (store.user?.name || store.user?.studentId || '')?.charAt(0) || '用' }}
        </el-avatar>
        <div class="profile-info">
          <div class="name">{{ store.user?.name || '-' }}</div>
          <div class="account">学号 {{ store.user?.studentId }}</div>
        </div>
        <el-button class="edit-btn" @click="openEdit">编辑资料</el-button>
      </div>
      <el-descriptions :column="1" border class="profile-desc">
        <el-descriptions-item label="学号">{{ store.user?.studentId }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ store.user?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="电话">{{ store.user?.phone || '-' }}</el-descriptions-item>
      </el-descriptions>
      <div class="actions">
        <el-button type="primary" @click="$router.push('/user/change-password')">修改密码</el-button>
        <el-button type="danger" @click="logout">退出登录</el-button>
      </div>
    </el-card>
    <el-dialog v-model="editVisible" title="编辑资料" width="420px" @close="cancelEdit">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="姓名"><el-input v-model="editForm.name" placeholder="选填" /></el-form-item>
        <el-form-item label="电话"><el-input v-model="editForm.phone" placeholder="选填" /></el-form-item>
        <el-form-item label="头像">
          <div class="avatar-upload">
            <el-avatar :size="56" :src="editAvatarDisplayUrl">
              {{ editForm.name?.charAt(0) || '头' }}
            </el-avatar>
            <el-upload :show-file-list="false" accept="image/*" :before-upload="onAvatarSelect">
              <el-button size="small">上传头像</el-button>
            </el-upload>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';
import { getProfile, updateProfile, uploadAvatar } from '@/api/auth';

const router = useRouter();
const store = useUserStore();

const editVisible = ref(false);
const saving = ref(false);
const editForm = reactive({ name: '', phone: '', avatar: '' });

const avatarUrl = computed(() => store.user?.avatar || '');
const editAvatarDisplayUrl = computed(() => {
  const p = editForm.avatar || '';
  return p ? (p + (p.includes('?') ? '&' : '?') + 't=' + editAvatarTs.value) : '';
});
const editAvatarTs = ref(0);

function openEdit() {
  editForm.name = store.user?.name ?? '';
  editForm.phone = store.user?.phone ?? '';
  editForm.avatar = store.user?.avatar ?? '';
  editVisible.value = true;
}

function cancelEdit() {
  editVisible.value = false;
}

async function onAvatarSelect(file: File) {
  try {
    const res = await uploadAvatar(file);
    const path = res?.path ?? null;
    if (path) {
      editForm.avatar = path;
      editAvatarTs.value = Date.now();
      ElMessage.success('头像已上传');
    } else {
      ElMessage.warning('未返回头像地址');
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '上传失败');
  }
  return false;
}

async function saveEdit() {
  saving.value = true;
  try {
    await updateProfile({ name: editForm.name || undefined, phone: editForm.phone || undefined, avatar: editForm.avatar || undefined });
    store.setProfile({ name: editForm.name || undefined, phone: editForm.phone || undefined, avatar: editForm.avatar || undefined });
    ElMessage.success('已保存');
    editVisible.value = false;
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

async function loadProfile() {
  try {
    const p = await getProfile() as any;
    if (p?.name !== undefined) store.setProfile({ name: p.name, phone: p.phone, avatar: p.avatar });
  } catch (_) {}
}

function logout() {
  store.logout();
  router.push('/');
}

onMounted(loadProfile);
</script>

<style scoped>
.profile-page { max-width: 560px; }
.profile-card { padding: 20px; }
.profile-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
.profile-header .avatar { flex-shrink: 0; }
.profile-info { flex: 1; min-width: 0; }
.profile-info .name { font-size: 18px; font-weight: 600; margin-bottom: 4px; }
.profile-info .account { color: #909399; font-size: 13px; }
.profile-header .edit-btn { flex-shrink: 0; margin-left: auto; }
.profile-desc { margin-bottom: 20px; }
.actions { display: flex; flex-wrap: wrap; gap: 12px; }
.avatar-upload { display: flex; align-items: center; gap: 12px; }
</style>
