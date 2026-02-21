<template>
  <div class="page">
    <!-- 登录后未确认时：半透明遮罩 + 居中白框弹窗 -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showConfirmModal" class="confirm-overlay" @click.self="() => {}">
          <div class="confirm-dialog">
            <h2 class="dialog-title">必读公告与通知</h2>
            <div class="dialog-body">
              <template v-if="modalLoading">
                <div class="dialog-loading"><el-icon class="is-loading"><Loading /></el-icon> 加载中…</div>
              </template>
              <template v-else-if="modalMustRead.length === 0 && modalNotifications.length === 0">
                <el-empty description="暂无需要确认的内容" />
                <p class="no-items-hint">可直接点击下方按钮进入。</p>
              </template>
              <template v-else>
                <div v-if="modalMustRead.length > 0" class="dialog-section">
                  <h4>必读公告</h4>
                  <div v-for="a in modalMustRead" :key="'m-' + a.id" class="dialog-item" :class="{ confirmed: confirmedAnnouncementIds.has(a.id) }">
                    <div class="item-main">
                      <div class="item-text">
                        <div class="item-title">{{ a.title }}</div>
                        <div class="item-content">{{ a.content }}</div>
                        <div class="item-time">{{ a.createdAt }}</div>
                      </div>
                      <el-button
                        v-if="!confirmedAnnouncementIds.has(a.id)"
                        type="success"
                        circle
                        size="small"
                        :loading="confirmingId === 'a-' + a.id"
                        @click="confirmOneAnnouncement(a)"
                        title="确认"
                      >
                        <el-icon><Check /></el-icon>
                      </el-button>
                      <el-icon v-else class="confirmed-icon" color="#67c23a"><Check /></el-icon>
                    </div>
                  </div>
                </div>
                <div v-if="modalNotifications.length > 0" class="dialog-section">
                  <h4>站内通知</h4>
                  <div v-for="n in modalNotifications" :key="'n-' + n.id" class="dialog-item" :class="{ unread: !n.isRead && !confirmedNotificationIds.has(n.id), confirmed: confirmedNotificationIds.has(n.id) }">
                    <div class="item-main">
                      <div class="item-text">
                        <div class="item-title">{{ n.title }}</div>
                        <div class="item-content">{{ n.content }}</div>
                        <div class="item-time">{{ n.createdAt }}</div>
                      </div>
                      <el-button
                        v-if="!confirmedNotificationIds.has(n.id)"
                        type="success"
                        circle
                        size="small"
                        :loading="confirmingId === 'n-' + n.id"
                        @click="confirmOneNotification(n)"
                        title="确认"
                      >
                        <el-icon><Check /></el-icon>
                      </el-button>
                      <el-icon v-else class="confirmed-icon" color="#67c23a"><Check /></el-icon>
                    </div>
                  </div>
                </div>
              </template>
            </div>
            <div class="dialog-footer">
              <el-button
                type="primary"
                size="large"
                :loading="confirming"
                :disabled="!allConfirmed"
                @click="confirmAllAndEnter"
              >
                全部确认并且进入
              </el-button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 已确认或从菜单进入：公告 + 站内通知 -->
    <div v-show="!showConfirmModal" class="content-wrap">
      <h2>通知与公告</h2>
      <h3 class="section-title">公告</h3>
      <el-empty v-if="!historyList.length && !historyLoading" description="暂无公告" />
      <template v-else>
        <el-card v-for="a in historyList" :key="'h-' + a.id" class="card">
          <h3>{{ a.title }}</h3>
          <div class="content">{{ a.content }}</div>
          <div class="time">{{ a.createdAt }}</div>
        </el-card>
      </template>
      <h3 class="section-title">站内通知</h3>
      <el-empty v-if="!notifications.length && !notifLoading" description="暂无站内通知" />
      <template v-else>
        <el-card v-for="n in notifications" :key="'n-' + n.id" class="card" :class="{ unread: !n.isRead }">
          <h3>{{ n.title }}</h3>
          <div class="content">{{ n.content }}</div>
          <div class="time">{{ n.createdAt }}</div>
        </el-card>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Loading, Check } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { getMustRead, getMustReadHistory, markAnnouncementsRead } from '@/api/announcement';
import { getNotifications, markRead, markAllRead } from '@/api/notification';
import type { Announcement } from '@/types';

const router = useRouter();
const store = useUserStore();
const historyList = ref<Announcement[]>([]);
const notifications = ref<Array<{ id: number; title: string; content: string; createdAt: string; isRead?: number }>>([]);
const historyLoading = ref(false);
const notifLoading = ref(false);

const modalMustRead = ref<Announcement[]>([]);
const modalNotifications = ref<Array<{ id: number; title: string; content: string; createdAt: string; isRead?: number }>>([]);
const modalLoading = ref(true);
const confirming = ref(false);
const confirmingId = ref<string | null>(null);
const confirmedAnnouncementIds = ref<Set<number>>(new Set());
const confirmedNotificationIds = ref<Set<number>>(new Set());

const showConfirmModal = computed(() => !store.announcementsConfirmed);

const allConfirmed = computed(() => {
  if (modalMustRead.value.length === 0 && modalNotifications.value.length === 0) return true;
  const allA = modalMustRead.value.every((a) => confirmedAnnouncementIds.value.has(a.id));
  const allN = modalNotifications.value.every((n) => confirmedNotificationIds.value.has(n.id));
  return allA && allN;
});

onMounted(async () => {
  if (!store.announcementsConfirmed) {
    modalLoading.value = true;
    try {
      const [mustRes, notifRes] = await Promise.all([
        getMustRead().catch(() => []),
        getNotifications(true, 20).catch(() => []), // 仅未读且最新 20 条
      ]);
      const mustList = Array.isArray(mustRes) ? mustRes : (mustRes as any)?.data ?? [];
      modalMustRead.value = mustList as Announcement[];
      const notifList = Array.isArray(notifRes) ? notifRes : (notifRes as any)?.data ?? [];
      modalNotifications.value = notifList as Array<{ id: number; title: string; content: string; createdAt: string; isRead?: number }>;
    } finally {
      modalLoading.value = false;
    }
  }

  historyLoading.value = true;
  notifLoading.value = true;
  try {
    historyList.value = (await getMustReadHistory()) as unknown as Announcement[];
  } finally {
    historyLoading.value = false;
  }
  try {
    notifications.value = (await getNotifications(undefined, 20)) as unknown as Array<{ id: number; title: string; content: string; createdAt: string; isRead?: number }>;
  } finally {
    notifLoading.value = false;
  }
});

async function confirmOneAnnouncement(a: Announcement) {
  confirmingId.value = 'a-' + a.id;
  try {
    await markAnnouncementsRead([a.id]);
    confirmedAnnouncementIds.value = new Set([...confirmedAnnouncementIds.value, a.id]);
  } catch (e: any) {
    ElMessage.error(e?.message || '确认失败');
  } finally {
    confirmingId.value = null;
  }
}

async function confirmOneNotification(n: { id: number }) {
  confirmingId.value = 'n-' + n.id;
  try {
    await markRead(n.id);
    confirmedNotificationIds.value = new Set([...confirmedNotificationIds.value, n.id]);
  } catch (e: any) {
    ElMessage.error(e?.message || '确认失败');
  } finally {
    confirmingId.value = null;
  }
}

async function confirmAllAndEnter() {
  if (!allConfirmed.value) return;
  confirming.value = true;
  try {
    const unconfirmedA = modalMustRead.value.filter((a) => !confirmedAnnouncementIds.value.has(a.id));
    const unconfirmedN = modalNotifications.value.filter((n) => !confirmedNotificationIds.value.has(n.id));
    if (unconfirmedA.length > 0) await markAnnouncementsRead(unconfirmedA.map((a) => a.id));
    for (const n of unconfirmedN) await markRead(n.id);
    await markAllRead(); // 进入后全部通知标为已读，下次登录不再显示
    store.setAnnouncementsConfirmed();
    router.replace('/venue-admin/applications');
  } catch (e: any) {
    ElMessage.error(e?.message || '确认失败');
  } finally {
    confirming.value = false;
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
.section-title { font-size: 14px; color: #666; margin: 20px 0 10px; }
.card { margin-bottom: 16px; }
.card.unread { border-left: 3px solid #409eff; }
.card h3 { margin-bottom: 8px; }
.card .content { white-space: pre-wrap; color: #666; margin: 8px 0; }
.card .time { font-size: 12px; color: #999; }
.content { white-space: pre-wrap; color: #666; margin: 8px 0; }
.time { font-size: 12px; color: #999; }

.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 16px;
}
.confirm-dialog {
  background: #fff;
  border-radius: 12px;
  max-width: 560px;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}
.dialog-title {
  margin: 0;
  padding: 20px 24px 12px;
  font-size: 18px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}
.dialog-body {
  padding: 16px 24px;
  overflow-y: auto;
  flex: 1;
  min-height: 120px;
}
.dialog-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: #666;
}
.dialog-section { margin-bottom: 20px; }
.dialog-section:last-child { margin-bottom: 0; }
.dialog-section h4 {
  margin: 0 0 10px;
  font-size: 14px;
  color: #409eff;
}
.dialog-item {
  padding: 12px;
  margin-bottom: 10px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 3px solid #dcdfe6;
}
.dialog-item.unread { border-left-color: #409eff; }
.dialog-item.confirmed { border-left-color: #67c23a; opacity: 0.85; }
.item-main {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.item-text { flex: 1; min-width: 0; }
.item-title { font-weight: 600; margin-bottom: 6px; }
.item-content { white-space: pre-wrap; font-size: 13px; color: #666; margin: 6px 0; }
.item-time { font-size: 12px; color: #999; }
.confirmed-icon { flex-shrink: 0; margin-top: 2px; }
.no-items-hint { text-align: center; color: #999; font-size: 13px; margin: -8px 0 0; }
.dialog-footer {
  padding: 16px 24px 20px;
  border-top: 1px solid #eee;
  flex-shrink: 0;
}
.dialog-footer .el-button { width: 100%; }

.modal-fade-enter-active,
.modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from,
.modal-fade-leave-to { opacity: 0; }
</style>
