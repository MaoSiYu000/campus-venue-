<template>
  <div class="page profile-page">
    <div class="profile-layout">
      <aside class="profile-left">
        <el-card class="left-card" shadow="hover">
          <el-avatar :size="88" :src="avatarUrl" class="avatar">
            {{ (store.user?.name || store.user?.workId || '')?.charAt(0) || '管' }}
          </el-avatar>
          <div class="name">{{ store.user?.name || '-' }}</div>
          <div class="subtitle">工号 {{ store.user?.workId || '-' }}</div>
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
              <span class="label">工号</span>
              <span class="value">{{ store.user?.workId || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">姓名</span>
              <span class="value">{{ store.user?.name || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">电话</span>
              <span class="value">{{ store.user?.phone || '-' }}</span>
            </div>
          </div>
          <div class="info-actions">
            <el-button type="primary" @click="openEdit">编辑资料</el-button>
            <el-button @click="$router.push('/venue-admin/change-password')">修改密码</el-button>
          </div>
        </el-card>

        <el-card class="recent-card" shadow="hover">
          <template #header>
            <span class="card-title">近期活动</span>
          </template>
          <div v-loading="recentLoading" class="recent-list">
            <template v-if="recentActions.length">
              <div
                v-for="b in recentActions"
                :key="b.id"
                class="recent-item"
                @click="$router.push('/venue-admin/applications')"
              >
                <div class="recent-meta">{{ b.venue?.name || '场地' }} · {{ b.activityName }}</div>
                <div class="recent-time">{{ formatDate(getDisplayDate(b)) }}</div>
                <el-tag size="small" class="recent-tag" :type="b.status === 'approved' ? 'success' : 'danger'">
                  {{ b.status === 'approved' ? '通过' : '驳回' }}预约
                </el-tag>
              </div>
            </template>
            <div v-else-if="!recentLoading" class="recent-empty">暂无近期活动</div>
          </div>
          <div v-if="recentActions.length" class="recent-more">
            <el-button link type="primary" @click="$router.push('/venue-admin/applications')">查看审批记录</el-button>
          </div>
        </el-card>
      </main>
    </div>

    <el-dialog v-model="editVisible" title="编辑资料" width="420px" @close="cancelEdit">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="姓名"><el-input v-model="editForm.name" placeholder="选填" /></el-form-item>
        <el-form-item label="电话"><el-input v-model="editForm.phone" placeholder="选填" /></el-form-item>
        <el-form-item label="头像">
          <div class="avatar-upload">
            <el-avatar :size="56" :src="editAvatarDisplayUrl">{{ editForm.name?.charAt(0) || '头' }}</el-avatar>
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
import { getHistoryList } from '@/api/booking';
import type { BookingApplication } from '@/types';

const router = useRouter();
const store = useUserStore();

const editVisible = ref(false);
const saving = ref(false);
const recentLoading = ref(false);
const editForm = reactive({ name: '', phone: '', avatar: '' });

const avatarUrl = computed(() => store.user?.avatar || '');
const editAvatarTs = ref(0);
const editAvatarDisplayUrl = computed(() => {
  const p = editForm.avatar || '';
  return p ? (p + (p.includes('?') ? '&' : '?') + 't=' + editAvatarTs.value) : '';
});

const recentActions = ref<BookingApplication[]>([]);

function formatDate(s: string | null | undefined) {
  if (!s) return '';
  const d = new Date(s);
  return d.toLocaleDateString('zh-CN') + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

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
    const p = (await getProfile()) as any;
    if (p) store.setProfile({ name: p.name, phone: p.phone, avatar: p.avatar });
  } catch (_) {}
}

function getApprovedBy(b: BookingApplication | Record<string, unknown>): number | null {
  const n = (b as Record<string, unknown>).approvedBy ?? (b as Record<string, unknown>).approved_by;
  if (n == null) return null;
  const num = Number(n);
  return Number.isNaN(num) ? null : num;
}

function getApprovedAt(b: BookingApplication | Record<string, unknown>): string | null {
  const t = (b as Record<string, unknown>).approvedAt ?? (b as Record<string, unknown>).approved_at;
  return t != null ? String(t) : null;
}

function getStatus(b: BookingApplication | Record<string, unknown>): string {
  const s = (b as Record<string, unknown>).status;
  return s != null ? String(s).toLowerCase() : '';
}

function getDisplayDate(b: BookingApplication | Record<string, unknown>): string | null {
  return getApprovedAt(b) || (b as BookingApplication).createdAt || null;
}

async function loadRecentActivities() {
  recentLoading.value = true;
  try {
    const list = await getHistoryList();
    const arr = Array.isArray(list) ? list : [];
    const myId = store.user?.id != null ? Number(store.user.id) : null;
    const mine =
      myId != null && !Number.isNaN(myId)
        ? arr.filter((b) => {
            const by = getApprovedBy(b);
            const status = getStatus(b);
            return by !== null && by === myId && (status === 'approved' || status === 'rejected');
          })
        : [];
    const sorted = [...mine].sort((a, b) => {
      const t1 = getApprovedAt(a) || (a.createdAt ?? '');
      const t2 = getApprovedAt(b) || (b.createdAt ?? '');
      return t2.localeCompare(t1);
    });
    recentActions.value = sorted.slice(0, 7) as BookingApplication[];
  } catch (_) {
    recentActions.value = [];
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
  height: calc(100vh - 90px);
  overflow: hidden;
  padding: 20px;
  box-sizing: border-box;
  background-image: url('/images/背景2.jpg');
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

.recent-tag {
  flex-shrink: 0;
  margin-left: auto;
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
