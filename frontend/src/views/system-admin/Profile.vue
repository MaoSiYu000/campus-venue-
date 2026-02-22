<template>
  <div class="page profile-page">
    <div class="profile-layout">
      <aside class="profile-left">
        <el-card class="left-card" shadow="hover">
          <el-avatar :size="88" :src="avatarUrl" class="avatar">
            {{ (store.user?.username || '')?.charAt(0) || '管' }}
          </el-avatar>
          <div class="name">{{ store.user?.username || '-' }}</div>
          <div class="subtitle">系统管理员</div>
          <el-button type="danger" plain class="logout-btn" @click="logout">退出登录</el-button>
        </el-card>
      </aside>

      <main class="profile-right">
        <el-card class="info-card" shadow="hover">
          <template #header>
            <span class="card-title">个人信息</span>
          </template>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">用户名</span>
              <span class="value">{{ store.user?.username || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">电话</span>
              <span class="value">{{ store.user?.phone || '-' }}</span>
            </div>
          </div>
          <div class="info-actions">
            <el-button type="primary" @click="openEdit">编辑资料</el-button>
            <el-button @click="$router.push('/system-admin/change-password')">修改密码</el-button>
          </div>
        </el-card>

        <el-card class="recent-card" shadow="hover">
          <template #header>
            <span class="card-title">近期活动</span>
          </template>
          <div v-loading="recentLoading" class="recent-list">
            <template v-if="recentAnnouncements.length">
              <div
                v-for="a in recentAnnouncements"
                :key="a.id"
                class="recent-item"
                @click="$router.push('/system-admin/announcements')"
              >
                <span class="recent-badge">发布公告</span>
                <div class="recent-meta">{{ a.title }}</div>
                <div class="recent-time">{{ formatDate(a.createdAt) }}</div>
              </div>
            </template>
            <div v-else-if="!recentLoading" class="recent-empty">暂无近期活动</div>
          </div>
          <div v-if="recentAnnouncements.length" class="recent-more">
            <el-button link type="primary" @click="$router.push('/system-admin/announcements')">查看全部公告</el-button>
          </div>
        </el-card>
      </main>
    </div>

    <el-dialog v-model="editVisible" title="编辑资料" width="420px" @close="cancelEdit">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="用户名"><el-input v-model="editForm.username" placeholder="登录用户名" /></el-form-item>
        <el-form-item label="电话"><el-input v-model="editForm.phone" placeholder="选填" /></el-form-item>
        <el-form-item label="头像">
          <div class="avatar-upload">
            <el-avatar :size="56" :src="editAvatarDisplayUrl">{{ store.user?.username?.charAt(0) || '头' }}</el-avatar>
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
import { getMyAnnouncements } from '@/api/announcement';
import type { Announcement } from '@/types';

const router = useRouter();
const store = useUserStore();

const editVisible = ref(false);
const saving = ref(false);
const recentLoading = ref(false);
const editForm = reactive({ username: '', phone: '', avatar: '' });

const avatarUrl = computed(() => store.user?.avatar || '');
const editAvatarTs = ref(0);
const editAvatarDisplayUrl = computed(() => {
  const p = editForm.avatar || '';
  return p ? (p + (p.includes('?') ? '&' : '?') + 't=' + editAvatarTs.value) : '';
});

const recentAnnouncements = ref<Announcement[]>([]);

function formatDate(s: string) {
  if (!s) return '';
  const d = new Date(s);
  return d.toLocaleDateString('zh-CN') + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function openEdit() {
  editForm.username = store.user?.username ?? '';
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
  if (!(editForm.username || '').trim()) {
    ElMessage.warning('用户名不能为空');
    return;
  }
  saving.value = true;
  try {
    await updateProfile({
      username: editForm.username?.trim() || undefined,
      phone: editForm.phone || undefined,
      avatar: editForm.avatar || undefined,
    });
    store.setProfile({
      username: editForm.username?.trim() || undefined,
      phone: editForm.phone || undefined,
      avatar: editForm.avatar || undefined,
    });
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
    const p = (await getProfile()) as any;
    if (p) store.setProfile({ username: p.username, phone: p.phone, avatar: p.avatar });
  } catch (_) {}
}

async function loadRecentActivities() {
  recentLoading.value = true;
  try {
    const list = await getMyAnnouncements();
    const arr = Array.isArray(list) ? list : [];
    const sorted = [...arr].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    recentAnnouncements.value = sorted.slice(0, 7) as Announcement[];
  } catch (_) {
    recentAnnouncements.value = [];
  } finally {
    recentLoading.value = false;
  }
}

function logout() {
  store.logout();
  router.push('/');
}

onMounted(() => {
  loadProfile();
  loadRecentActivities();
});
</script>

<style scoped>
/* 负边距抵消布局 padding，底纹从页眉下铺满整页 */
.profile-page {
  margin: -20px;
  width: calc(100% + 40px);
  min-height: calc(100vh - 60px);
  padding: 20px;
  box-sizing: border-box;
  background-image: url('/images/底纹.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.profile-layout {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.profile-left {
  flex: 0 0 25%;
  max-width: 280px;
}

.left-card {
  text-align: center;
  padding: 24px 16px;
}

.left-card .avatar {
  margin-bottom: 16px;
}

.left-card .name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 6px;
}

.left-card .subtitle {
  font-size: 14px;
  color: #909399;
  margin-bottom: 20px;
}

.logout-btn {
  width: 100%;
}

.profile-right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.info-card :deep(.el-card__body) {
  padding-bottom: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 24px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-item .label {
  color: #909399;
  font-size: 14px;
  min-width: 56px;
}

.info-item .value {
  color: #303133;
  font-size: 14px;
}

.info-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.recent-list {
  min-height: 80px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
}

.recent-item:last-child {
  border-bottom: none;
}

.recent-item:hover {
  background: #f5f7fa;
}

.recent-badge {
  flex-shrink: 0;
  font-size: 12px;
  color: #409eff;
  font-weight: 500;
}

.recent-meta {
  flex: 1;
  font-size: 14px;
  color: #303133;
  min-width: 0;
}

.recent-time {
  flex-shrink: 0;
  font-size: 12px;
  color: #909399;
}

.recent-empty {
  color: #909399;
  font-size: 14px;
  padding: 24px 0;
  text-align: center;
}

.recent-more {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.avatar-upload {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
