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

    <!-- 已确认或从菜单进入：三区域，按页面比例固定布局 -->
    <div v-show="!showConfirmModal" class="content-wrap">
      <div class="title-box">
        <h2 class="page-title-serif">通知与公告</h2>
      </div>
      <div class="panel announcements-panel">
        <h3 class="section-title">公告</h3>
        <div class="panel-inner">
          <el-empty v-if="!historyList.length && !historyLoading" description="暂无公告" />
          <template v-else>
            <div
              v-for="a in historyList"
              :key="'h-' + a.id"
              class="announcement-title-item"
              @click="openAnnouncementDetail(a)"
            >
              <div class="ann-date-square">
                <div class="ann-date-top">{{ formatAnnDate(a.createdAt) }}</div>
                <div class="ann-date-bottom">{{ formatAnnYearMonth(a.createdAt) }}</div>
              </div>
              <div class="ann-title-text">{{ a.title }}</div>
            </div>
          </template>
        </div>
      </div>
      <div class="panel notifications-panel">
        <h3 class="section-title">站内通知</h3>
        <div class="panel-inner">
          <el-empty v-if="!notifications.length && !notifLoading" description="暂无站内通知" />
          <template v-else>
            <el-card v-for="n in notifications" :key="'n-' + n.id" class="card notif-card" :class="{ unread: !n.isRead }">
              <div class="notif-body">
                <h3><span class="status-badge">{{ n.title }}</span></h3>
                <div class="content">{{ n.content }}</div>
                <div class="time">{{ formatNotifDate(n.createdAt) }}</div>
              </div>
            </el-card>
          </template>
        </div>
      </div>
    </div>

    <el-dialog v-model="detailVisible" title="公告详情" width="500px">
      <template v-if="detailAnnouncement">
        <h3 class="detail-title">{{ detailAnnouncement.title }}</h3>
        <div class="detail-content">{{ detailAnnouncement.content }}</div>
        <div class="detail-time">{{ detailAnnouncement.createdAt }}</div>
      </template>
    </el-dialog>
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
const detailVisible = ref(false);
const detailAnnouncement = ref<Announcement | null>(null);

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

function formatAnnDate(s: string | undefined): string {
  if (!s) return '-';
  const d = new Date(s);
  return String(d.getDate());
}
function formatAnnYearMonth(s: string | undefined): string {
  if (!s) return '-';
  const d = new Date(s);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}
function formatNotifDate(s: string | undefined): string {
  if (!s) return '-';
  const d = new Date(s);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function openAnnouncementDetail(a: Announcement) {
  detailAnnouncement.value = a;
  detailVisible.value = true;
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
  height: 100%;
  max-height: calc(100vh - 130px);
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0;
  overflow: hidden;
}
.content-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 0;
}
/* 通知与公告：左 1/8，上 1/16 到 1/4，与公告栏同宽 */
.title-box {
  position: absolute;
  left: 12.5%;
  width: 25%;
  top: 6.25%;
  height: 18.75%;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 10px;
  background: #325ba7;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}
.page-title-serif {
  margin: 0;
  font-family: 'Noto Serif SC', 'Source Han Serif SC', serif;
  font-weight: 700;
  font-size: clamp(18px, 2.2vw, 24px);
  color: #fff;
  letter-spacing: 0.02em;
}
/* 公告：宽度与标题一致，上下高度变短 */
.announcements-panel {
  position: absolute;
  left: 12.5%;
  width: 25%;
  top: 32.65%;
  bottom: 27.5%;
  display: flex;
  flex-direction: column;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafafa;
  min-height: 0;
}
.announcements-panel .section-title {
  font-size: 16px;
  font-weight: 600;
  font-family: 'Noto Serif SC', 'Source Han Serif SC', serif;
  color: #fff;
  margin: 0;
  padding: 10px 14px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  background: #325ba7;
  border-radius: 8px 8px 0 0;
  flex-shrink: 0;
}
.announcements-panel .panel-inner {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px;
}
/* 每条公告：长方体，紧密排列无间隔，日期正方形在内部有间隔 */
.announcement-title-item {
  display: flex;
  align-items: center;
  margin: 0;
  padding: 12px 10px;
  min-height: 72px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 0;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
  overflow: hidden;
}
.announcement-title-item + .announcement-title-item { border-top: none; }
.announcement-title-item:hover {
  background: #ecf5ff;
  border-color: #409eff;
}
.ann-date-square {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  margin-right: 10px;
  display: flex;
  flex-direction: column;
  border-radius: 4px;
  overflow: hidden;
}
.ann-date-top {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #87ceeb;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}
.ann-date-bottom {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  color: #325ba7;
  font-size: 12px;
  border-top: 1px solid #e8e8e8;
}
.ann-title-text {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 4px;
  font-size: 16px;
  color: #303133;
  line-height: 1.35;
  min-width: 0;
}
/* 站内通知：左 3/8+1/16 到右 1/8，上 1/16 到底-1/16 */
.panel.notifications-panel {
  position: absolute;
  left: 43.75%;
  right: 12.5%;
  top: 6.25%;
  bottom: 6.25%;
  display: flex;
  flex-direction: column;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafafa;
  min-height: 0;
}
.panel .section-title {
  font-size: 16px;
  font-weight: 600;
  font-family: 'Noto Serif SC', 'Source Han Serif SC', serif;
  color: #fff;
  margin: 0;
  padding: 10px 14px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  background: #325ba7;
  border-radius: 8px 8px 0 0;
  flex-shrink: 0;
}
.panel-inner {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 14px;
}
.card { margin-bottom: 32px; }
.card.unread { border-left: 3px solid #409eff; }
.card h3 { margin-bottom: 8px; }
.notif-body { position: relative; min-height: 48px; padding-bottom: 20px; }
.notif-body .content { white-space: pre-wrap; color: #666; margin: 8px 0; font-size: 15px; }
.status-badge {
  display: inline;
  background: #7f9ee7;
  color: #fff;
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 18px;
}
.notif-body .time {
  position: absolute;
  bottom: 0;
  right: 0;
  font-size: 12px;
  color: #999;
}

.detail-title { margin: 0 0 12px; font-size: 16px; text-align: center; }
.detail-content { white-space: pre-wrap; color: #555; line-height: 1.6; margin-bottom: 12px; }
.detail-time { font-size: 12px; color: #999; }

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
