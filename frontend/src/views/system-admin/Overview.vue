<template>
  <div class="page">
    <header class="page-banner">
      <h2>全校预约总览</h2>
    </header>
    <div class="page-content">
      <el-tabs v-model="activeTab" class="overview-tabs">
        <el-tab-pane label="详细信息" name="detail">
        <div class="toolbar">
          <el-radio-group v-model="statusFilter" size="default">
            <el-radio-button value="all">全部</el-radio-button>
            <el-radio-button value="not_rejected">未驳回</el-radio-button>
            <el-radio-button value="rejected">已驳回</el-radio-button>
          </el-radio-group>
        </div>
        <el-table :data="filteredList" v-loading="loading" border>
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column label="场地" width="120">
            <template #default="{ row }">{{ row.venue?.name }}</template>
          </el-table-column>
          <el-table-column prop="useDate" label="使用日期" width="110" />
          <el-table-column label="时间段" width="120">
            <template #default="{ row }">{{ row.startTime }} - {{ row.endTime }}</template>
          </el-table-column>
          <el-table-column prop="activityName" label="活动名称" min-width="120" />
          <el-table-column label="申请人" width="100">
            <template #default="{ row }">{{ row.user?.name || row.user?.studentId }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90" fixed="right">
            <template #default="{ row }">
              <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        </el-tab-pane>
        <el-tab-pane label="可视化分析" name="visual">
        <div class="visual-section">
          <h3>1. 按场地查看各时段预约情况</h3>
          <el-select v-model="selectedVenueId" placeholder="选择场地" clearable style="width: 220px; margin-bottom: 16px">
            <el-option v-for="v in venues" :key="v.id" :label="v.name" :value="v.id" />
          </el-select>
          <div v-if="selectedVenueId" class="timeline-wrap">
            <div class="timeline-axis">
              <div
                v-for="item in venueSlotData"
                :key="item.label"
                class="timeline-segment"
                :class="{ 'has-count': item.count > 0 }"
                :style="{ '--intensity': item.ratePercent }"
                :title="`${item.label}：${item.count} 次`"
              >
                <span class="segment-label">{{ item.label.slice(0, 5) }}</span>
                <span class="segment-count">{{ item.count }}</span>
              </div>
            </div>
          </div>
          <p v-else class="hint">请先选择场地，数据来自未驳回的成功预约。</p>
        </div>
        <div class="visual-section">
          <h3>2. 各场地近期预约次数</h3>
          <div class="chart-wrap">
            <div v-for="item in venueCountData" :key="item.venueId" class="bar-row">
              <span class="bar-label">{{ item.venueName }}</span>
              <div class="bar-track">
                <div class="bar-fill count-bar" :style="{ width: item.percent + '%' }" />
              </div>
              <span class="bar-value">{{ item.count }} 次</span>
            </div>
          </div>
          <p class="hint">统计未驳回的成功预约，近 30 天；与详细信息联动，删除后此处同步更新。</p>
        </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getAllBookings, deleteBooking } from '@/api/booking';
import { getVenueList } from '@/api/venue';
import type { BookingApplication, BookingStatus } from '@/types';
import type { Venue } from '@/types';
import { ElMessage, ElMessageBox } from 'element-plus';

const activeTab = ref('detail');
const list = ref<BookingApplication[]>([]);
const venues = ref<Venue[]>([]);
const loading = ref(false);
const statusFilter = ref<'all' | 'not_rejected' | 'rejected'>('all');
const selectedVenueId = ref<number | null>(null);

const TIME_SLOTS = [
  '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00', '13:00-14:00',
  '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00', '18:00-19:00', '19:00-20:00',
  '20:00-21:00', '21:00-22:00',
];

function statusText(s: BookingStatus) {
  const m: Record<BookingStatus, string> = { pending: '待审核', approved: '已通过', rejected: '已驳回', used: '已使用', cancelled: '已取消' };
  return m[s] || s;
}

function statusType(s: BookingStatus) {
  const m: Record<BookingStatus, string> = { pending: 'warning', approved: 'success', rejected: 'danger', used: 'info', cancelled: 'info' };
  return m[s] || 'info';
}

const filteredList = computed(() => {
  if (statusFilter.value === 'all') return list.value;
  if (statusFilter.value === 'rejected') return list.value.filter((b) => b.status === 'rejected');
  return list.value.filter((b) => b.status !== 'rejected');
});

/** 未驳回的成功预约（用于可视化联动） */
const successList = computed(() =>
  list.value.filter((b) => b.status === 'approved' || b.status === 'used')
);

function parseTime(t: string) {
  const s = String(t).trim().slice(0, 5);
  const [h, m] = s.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function bookingOverlapsSlot(booking: BookingApplication, slotStart: string, slotEnd: string) {
  const slotMin = parseTime(slotStart);
  const slotMax = parseTime(slotEnd);
  const bStart = parseTime(booking.startTime);
  const bEnd = parseTime(booking.endTime);
  return bStart < slotMax && bEnd > slotMin;
}

const venueSlotData = computed(() => {
  if (!selectedVenueId.value) return [];
  const data = TIME_SLOTS.map((label) => {
    const parts = label.split('-').map((x) => x.trim());
    const slotStart = parts[0];
    const slotEnd = parts[1] || parts[0];
    const count = successList.value.filter(
      (b) => b.venueId === selectedVenueId.value && bookingOverlapsSlot(b, slotStart, slotEnd)
    ).length;
    return { label, count };
  });
  const max = Math.max(1, ...data.map((d) => d.count));
  return data.map((d) => ({ ...d, ratePercent: (d.count / max) * 100 }));
});

const RECENT_DAYS = 30;

const venueCountData = computed(() => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RECENT_DAYS);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const recent = successList.value.filter((b) => b.useDate >= cutoffStr);
  const byVenue = new Map<number, number>();
  const venueNames = new Map<number, string>();
  for (const b of recent) {
    byVenue.set(b.venueId, (byVenue.get(b.venueId) ?? 0) + 1);
    if (b.venue?.name) venueNames.set(b.venueId, b.venue.name);
  }
  const arr = Array.from(byVenue.entries()).map(([venueId, count]) => ({
    venueId,
    venueName: venueNames.get(venueId) ?? `场地 #${venueId}`,
    count,
  }));
  arr.sort((a, b) => b.count - a.count);
  const max = Math.max(1, ...arr.map((x) => x.count));
  return arr.map((x) => ({ ...x, percent: (x.count / max) * 100 }));
});

async function loadData() {
  loading.value = true;
  try {
    const [bookings, venueList] = await Promise.all([getAllBookings(), getVenueList()]);
    list.value = bookings;
    venues.value = venueList;
  } finally {
    loading.value = false;
  }
}

async function handleDelete(row: BookingApplication) {
  try {
    await ElMessageBox.confirm(`确定删除预约「${row.activityName}」吗？删除后可视化数据会同步更新。`, '删除预约', {
      type: 'warning',
    });
    await deleteBooking(row.id);
    ElMessage.success('已删除');
    await loadData();
  } catch (e: unknown) {
    if ((e as { action?: string })?.action !== 'cancel') ElMessage.error((e as Error)?.message ?? '删除失败');
  }
}

onMounted(loadData);
</script>

<style scoped>
.page {
  min-height: calc(100vh - 100px);
  width: calc(100% + 40px);
  margin: -20px -20px 0 -20px;
  display: flex;
  flex-direction: column;
  padding: 0;
  box-sizing: border-box;
}
.page-banner {
  height: 18.75vh;
  min-height: 90px;
  margin: 0;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 6.25%;
  padding-top: 68px;
  background-color: #e8f4ff;
  background-image: url(/images/页面底纹.jpg), linear-gradient(180deg, #e8f4ff 0%, #f0f7ff 100%);
  background-size: 100% 100%;
  background-position: 0 0;
  background-repeat: no-repeat;
  box-sizing: border-box;
}
.page-banner h2 {
  margin: 0;
  font-size: 32px;
  color: #fff;
  position: relative;
  z-index: 1;
}
.page-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow: hidden;
}
/* 页签栏：白色一行 */
.overview-tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.overview-tabs :deep(.el-tabs__header) {
  order: 0;
  margin: 0;
  padding: 0 16px;
  background: #fff;
  border-radius: 8px 8px 0 0;
  border: 1px solid #ebeef5;
  border-bottom: none;
  flex-shrink: 0;
}
.overview-tabs :deep(.el-tabs__nav-wrap) { background: #fff; }
.overview-tabs :deep(.el-tabs__nav) { border: none; }
.overview-tabs :deep(.el-tabs__item) { color: #606266; }
.overview-tabs :deep(.el-tabs__item.is-active) { color: #325ba7; font-weight: 600; }
.overview-tabs :deep(.el-tabs__active-bar),
.overview-tabs :deep(.el-tabs__ink-bar) { background-color: #325ba7; }
.overview-tabs :deep(.el-tabs__content) {
  order: 1;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 0 0 8px 8px;
  padding: 12px;
}
.toolbar {
  margin-bottom: 16px;
}
.visual-section {
  margin-bottom: 32px;
}
.visual-section h3 {
  margin-bottom: 12px;
  font-size: 15px;
  color: #303133;
}

.timeline-wrap {
  margin-bottom: 8px;
}
.timeline-axis {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 2px;
  min-height: 56px;
  background: #f5f7fa;
  padding: 4px;
  border-radius: 8px;
  overflow-x: auto;
}
.timeline-segment {
  flex: 1;
  min-width: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: rgba(144, 147, 153, 0.15);
  transition: background 0.2s;
}
.timeline-segment.has-count {
  background: rgba(64, 158, 255, calc(0.2 + var(--intensity, 0) * 0.008));
  border: 1px solid rgba(64, 158, 255, 0.4);
}
.segment-label {
  font-size: 11px;
  color: #909399;
  margin-bottom: 2px;
}
.timeline-segment.has-count .segment-label {
  color: #606266;
}
.segment-count {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}
.timeline-segment:not(.has-count) .segment-count {
  color: #c0c4cc;
}

.chart-wrap {
  max-width: 560px;
}
.bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.bar-label {
  width: 100px;
  flex-shrink: 0;
  font-size: 13px;
  color: #606266;
}
.bar-track {
  flex: 1;
  height: 22px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff 0%, #66b1ff 100%);
  border-radius: 4px;
  min-width: 0;
  transition: width 0.3s;
}
.bar-fill.count-bar {
  background: linear-gradient(90deg, #67c23a 0%, #85ce61 100%);
}
.bar-value {
  width: 56px;
  flex-shrink: 0;
  font-size: 13px;
  color: #909399;
}
.hint {
  font-size: 13px;
  color: #909399;
  margin-top: 8px;
}
</style>
