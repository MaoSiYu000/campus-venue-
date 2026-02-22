<template>
  <div class="page profile-page">
    <div class="profile-layout">
      <!-- 左侧 1/4：头像、名字、学号、退出登录 -->
      <aside class="profile-left">
        <el-card class="left-card" shadow="hover">
          <el-avatar :size="88" :src="avatarUrl" class="avatar">
            {{ (store.user?.name || store.user?.studentId || '')?.charAt(0) || '用' }}
          </el-avatar>
          <div class="name">{{ store.user?.name || '-' }}</div>
          <div class="student-id">学号 {{ store.user?.studentId || '-' }}</div>
          <el-button type="danger" plain class="logout-btn" @click="logout">退出登录</el-button>
        </el-card>
      </aside>

      <!-- 右侧 3/4：个人信息 + 近期活动 -->
      <main class="profile-right">
        <!-- 上部分：个人信息 -->
        <el-card class="info-card" shadow="hover">
          <template #header>
            <span class="card-title">个人信息</span>
          </template>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">学号</span>
              <span class="value">{{ store.user?.studentId || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">姓名</span>
              <span class="value">{{ store.user?.name || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">学院</span>
              <span class="value">{{ store.user?.college || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">专业</span>
              <span class="value">{{ store.user?.major || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">班级</span>
              <span class="value">{{ store.user?.class || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">电话</span>
              <span class="value">{{ store.user?.phone || '-' }}</span>
            </div>
          </div>
          <div class="info-actions">
            <el-button type="primary" @click="openEdit">编辑资料</el-button>
            <el-button @click="$router.push('/user/change-password')">修改密码</el-button>
          </div>
        </el-card>

        <!-- 下部分：近期活动（最多 5 条预约） -->
        <el-card class="recent-card" shadow="hover">
          <template #header>
            <span class="card-title">近期活动</span>
          </template>
          <div v-loading="recentLoading" class="recent-list">
            <template v-if="recentBookings.length">
              <div
                v-for="b in recentBookings"
                :key="b.id"
                class="recent-item"
                @click="$router.push('/user/my-bookings')"
              >
                <div class="recent-venue">{{ b.venue?.name || '场地' }}</div>
                <div class="recent-meta">
                  {{ b.useDate }} {{ b.startTime }}-{{ b.endTime }} · {{ b.activityName }}
                </div>
                <el-tag size="small" :type="statusTagType(b.status)">{{ statusText(b.status) }}</el-tag>
              </div>
            </template>
            <div v-else-if="!recentLoading" class="recent-empty">暂无近期预约</div>
          </div>
          <div v-if="recentBookings.length" class="recent-more">
            <el-button link type="primary" @click="$router.push('/user/my-bookings')">查看全部预约</el-button>
          </div>
        </el-card>
      </main>
    </div>

    <!-- 编辑资料弹窗 -->
    <el-dialog v-model="editVisible" title="编辑资料" width="420px" @close="cancelEdit">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="姓名"><el-input v-model="editForm.name" placeholder="选填" /></el-form-item>
        <el-form-item label="学院"><el-input v-model="editForm.college" placeholder="选填" /></el-form-item>
        <el-form-item label="专业"><el-input v-model="editForm.major" placeholder="选填" /></el-form-item>
        <el-form-item label="班级"><el-input v-model="editForm.class" placeholder="选填" /></el-form-item>
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
import { getMyBookings } from '@/api/booking';
import type { BookingApplication, BookingStatus } from '@/types';

const router = useRouter();
const store = useUserStore();

const editVisible = ref(false);
const saving = ref(false);
const recentLoading = ref(false);
const editForm = reactive({ name: '', college: '', major: '', class: '', phone: '', avatar: '' });

const avatarUrl = computed(() => store.user?.avatar || '');
const editAvatarDisplayUrl = computed(() => {
  const p = editForm.avatar || '';
  return p ? (p + (p.includes('?') ? '&' : '?') + 't=' + editAvatarTs.value) : '';
});
const editAvatarTs = ref(0);

const recentBookings = ref<BookingApplication[]>([]);

function statusText(s: BookingStatus) {
  const m: Record<BookingStatus, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已驳回',
    used: '已使用',
    cancelled: '已取消',
  };
  return m[s] ?? s;
}

function statusTagType(s: BookingStatus): 'warning' | 'success' | 'danger' | 'info' {
  if (s === 'approved' || s === 'used') return 'success';
  if (s === 'rejected' || s === 'cancelled') return 'danger';
  return 'warning';
}

function openEdit() {
  editForm.name = store.user?.name ?? '';
  editForm.college = store.user?.college ?? '';
  editForm.major = store.user?.major ?? '';
  editForm.class = store.user?.class ?? '';
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
    await updateProfile({
      name: editForm.name || undefined,
      college: editForm.college || undefined,
      major: editForm.major || undefined,
      class: editForm.class || undefined,
      phone: editForm.phone || undefined,
      avatar: editForm.avatar || undefined,
    });
    store.setProfile({
      name: editForm.name || undefined,
      college: editForm.college || undefined,
      major: editForm.major || undefined,
      class: editForm.class || undefined,
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
    if (p && (p.name !== undefined || p.phone !== undefined || p.avatar !== undefined || p.college !== undefined || p.major !== undefined || p.class !== undefined)) {
      store.setProfile({ name: p.name, phone: p.phone, college: p.college, major: p.major, class: p.class, avatar: p.avatar });
    }
  } catch (_) {}
}

async function loadRecentBookings() {
  recentLoading.value = true;
  try {
    const list = await getMyBookings();
    const arr = Array.isArray(list) ? list : [];
    const sorted = [...arr].sort((a, b) => {
      const d = (b.useDate || '').localeCompare(a.useDate || '');
      if (d !== 0) return d;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
    recentBookings.value = sorted.slice(0, 5);
  } catch (_) {
    recentBookings.value = [];
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
  loadRecentBookings();
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

.left-card .student-id {
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

.recent-venue {
  font-weight: 500;
  min-width: 100px;
}

.recent-meta {
  flex: 1;
  font-size: 13px;
  color: #606266;
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
