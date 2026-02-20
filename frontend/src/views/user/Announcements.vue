<template>
  <div class="page">
    <div class="content-wrap">
      <h2>通知与公告</h2>
      <el-tabs v-model="activeTab" class="announce-tabs">
        <el-tab-pane label="必读公告" name="must-read">
          <el-empty v-if="!list.length && !loading" description="暂无必读公告" />
          <template v-else>
            <el-card v-for="a in list" :key="'a-' + a.id" class="announcement-card">
              <h3>{{ a.title }}</h3>
              <div class="content">{{ a.content }}</div>
              <div class="time">{{ a.createdAt }}</div>
              <div class="card-actions">
                <el-button type="primary" size="small" :loading="confirmingId === a.id" @click="confirmOne(a)">
                  确认
                </el-button>
              </div>
            </el-card>
          </template>
          <div v-if="!loading && list.length === 0" class="enter-area">
            <el-button type="primary" size="large" @click="enterMain">
              进入主界面
            </el-button>
          </div>
        </el-tab-pane>
        <el-tab-pane label="历史公告" name="history">
          <el-empty v-if="!historyList.length && !historyLoading" description="暂无历史公告" />
          <template v-else>
            <el-card v-for="a in historyList" :key="'h-' + a.id" class="announcement-card history">
              <h3>{{ a.title }}</h3>
              <div class="content">{{ a.content }}</div>
              <div class="time">{{ a.createdAt }}</div>
            </el-card>
          </template>
        </el-tab-pane>
      </el-tabs>
      <h3 class="section-title">站内通知</h3>
      <el-empty v-if="!notifications.length && !notifLoading" description="暂无站内通知" />
      <template v-else>
        <el-card v-for="n in notifications" :key="'n-' + n.id" class="announcement-card notif-card" :class="{ unread: !n.isRead }">
          <span class="notif-close" :class="{ loading: deletingId === n.id }" @click="deleteNotif(n)" title="删除">×</span>
          <div class="notif-body">
            <h3>{{ n.title }}</h3>
            <div class="content">{{ n.content }}</div>
            <div class="time">{{ n.createdAt }}</div>
          </div>
        </el-card>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { getMustRead, getMustReadHistory, markAnnouncementsRead } from '@/api/announcement';
import { getNotifications, deleteNotification } from '@/api/notification';
import type { Announcement } from '@/types';

const router = useRouter();
const store = useUserStore();
const list = ref<Announcement[]>([]);
const historyList = ref<Announcement[]>([]);
const notifications = ref<Array<{ id: number; title: string; content: string; createdAt: string; isRead?: number }>>([]);
const loading = ref(false);
const historyLoading = ref(false);
const notifLoading = ref(false);
const confirmingId = ref<number | null>(null);
const deletingId = ref<number | null>(null);
const activeTab = ref<'must-read' | 'history'>('must-read');

onMounted(async () => {
  loading.value = true;
  historyLoading.value = true;
  notifLoading.value = true;
  try {
    list.value = (await getMustRead()) as unknown as Announcement[];
  } finally {
    loading.value = false;
  }
  try {
    historyList.value = (await getMustReadHistory()) as unknown as Announcement[];
  } finally {
    historyLoading.value = false;
  }
  try {
    notifications.value = (await getNotifications()) as unknown as Array<{ id: number; title: string; content: string; createdAt: string; isRead?: number }>;
  } finally {
    notifLoading.value = false;
  }
});

async function confirmOne(a: Announcement) {
  confirmingId.value = a.id;
  try {
    await markAnnouncementsRead([a.id]);
    list.value = list.value.filter((x) => x.id !== a.id);
    historyList.value = [a, ...historyList.value];
  } catch (e: any) {
    ElMessage.error(e?.message || '确认失败');
  } finally {
    confirmingId.value = null;
  }
}

function enterMain() {
  store.setAnnouncementsConfirmed();
  router.push('/user/venue-list');
}

async function deleteNotif(n: { id: number; title: string }) {
  deletingId.value = n.id;
  try {
    await deleteNotification(n.id);
    notifications.value = notifications.value.filter((x) => x.id !== n.id);
    ElMessage.success('已删除');
  } catch (e: any) {
    ElMessage.error(e?.message || '删除失败');
  } finally {
    deletingId.value = null;
  }
}
</script>

<style scoped>
.page {
  min-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  max-width: 720px;
  margin: 0 auto;
}
.content-wrap { flex: 0 0 auto; }
.announce-tabs { margin-top: 12px; }
.enter-area { margin: 16px 0 24px; }
.section-title { font-size: 14px; color: #666; margin: 20px 0 10px; }
.announcement-card { margin-bottom: 16px; }
.announcement-card.unread { border-left: 3px solid #409eff; }
.announcement-card.history { opacity: 0.7; }
.announcement-card h3 { margin-bottom: 8px; }
.announcement-card .content { white-space: pre-wrap; color: #666; margin: 8px 0; }
.announcement-card .time { font-size: 12px; color: #999; }
.card-actions { margin-top: 12px; padding-top: 8px; border-top: 1px solid #eee; }

.notif-card { position: relative; padding-left: 36px; }
.notif-close {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  line-height: 1;
  color: #f56c6c;
  cursor: pointer;
  border-radius: 4px;
  user-select: none;
}
.notif-close:hover { background: rgba(245, 108, 108, 0.12); color: #f56c6c; }
.notif-close.loading { opacity: 0.6; cursor: not-allowed; pointer-events: none; }
.notif-body { flex: 1; }
.content { white-space: pre-wrap; color: #666; margin: 8px 0; }
.time { font-size: 12px; color: #999; }
</style>
