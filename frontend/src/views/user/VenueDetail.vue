<template>
  <div class="page">
    <el-button link @click="$router.push('/user/venue-list')">← 返回列表</el-button>
    <el-card v-if="venue" style="margin-top: 16px">
      <h2>{{ venue.name }}</h2>
      <div v-if="venue.photos?.length" class="venue-photos-section">
        <h3>场地照片</h3>
        <div class="venue-photos-list">
          <a v-for="(url, i) in venue.photos" :key="i" :href="photoSrc(url)" target="_blank" rel="noopener" class="venue-photo-item">
            <img :src="photoSrc(url)" :alt="`照片 ${i + 1}`" />
          </a>
        </div>
      </div>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="类型">{{ venueTypeName(venue.venueType) }}</el-descriptions-item>
        <el-descriptions-item label="容量">{{ venue.capacity }} 人</el-descriptions-item>
        <el-descriptions-item label="位置">{{ venue.location || '-' }}</el-descriptions-item>
        <el-descriptions-item label="地址">{{ venue.address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="开放时间">{{ venue.openTime }} - {{ venue.closeTime }}</el-descriptions-item>
        <el-descriptions-item label="设备">
          {{ venue.hasProjector ? '投影 ' : '' }}{{ venue.hasSound ? '音响' : '' }} {{ !venue.hasProjector && !venue.hasSound ? '无' : '' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="venue.isAvailable ? 'success' : 'info'">{{ venue.isAvailable ? '可用' : '不可用' }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <div class="day-timeline-section">
        <h3>当日预约情况</h3>
        <div class="date-picker-row">
          <span class="label">选择日期：</span>
          <el-date-picker
            v-model="selectedDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :disabled-date="disabledDate"
            @change="onDateChange"
          />
        </div>
        <template v-if="selectedDate">
          <div v-if="daySlotsLoading" class="timeline-loading"><el-icon class="is-loading"><Loading /></el-icon> 加载中…</div>
          <div v-else class="timeline-wrap">
            <div class="timeline-title">{{ selectedDate }} 时间轴</div>
            <div class="timeline-horizontal">
              <div class="timeline-axis">
                <span
                  v-for="t in timelineAxisLabels"
                  :key="t"
                  class="axis-tick"
                  :style="{ left: axisLabelPosition(t) + '%' }"
                >{{ t }}</span>
              </div>
              <div class="timeline-track">
                <div
                  v-for="(seg, i) in timelineSegments"
                  :key="i"
                  class="timeline-seg horizontal"
                  :class="seg.status"
                  :style="{ left: seg.leftPercent + '%', width: seg.widthPercent + '%' }"
                  :title="seg.start + ' - ' + seg.end + (seg.activityName ? ': ' + seg.activityName : '')"
                >
                  <span class="seg-label">
                    <template v-if="seg.status === 'free'">空闲</template>
                    <template v-else-if="seg.status === 'booked'">{{ seg.activityName || '已预约' }}</template>
                    <template v-else>不可用</template>
                  </span>
                </div>
              </div>
            </div>
            <div class="timeline-legend">
              <span class="legend-item free">空闲</span>
              <span class="legend-item booked">已预约</span>
              <span class="legend-item unavailable">不可用</span>
            </div>
          </div>
        </template>
        <p v-else class="hint">请选择日期查看该场地当日各时段是否已被预约。</p>
      </div>

      <div style="margin-top: 16px">
        <el-button type="primary" :disabled="!venue.isAvailable" @click="$router.push({ path: '/user/booking-apply', query: { venueId: venue.id } })">
          预约此场地
        </el-button>
      </div>
    </el-card>
    <el-skeleton v-else :rows="5" animated />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Loading } from '@element-plus/icons-vue';
import { useRoute } from 'vue-router';
import { getVenue } from '@/api/venue';
import { getVenueDaySlots } from '@/api/booking';
import type { Venue } from '@/types';

const route = useRoute();
const venue = ref<Venue | null>(null);
const venueId = computed(() => Number(route.params.id));
const selectedDate = ref<string | null>(null);
const daySlots = ref<{ bookings: { startTime: string; endTime: string; status: string; activityName: string }[]; unavailableSlots: { startTime: string; endTime: string; reason?: string }[] } | null>(null);
const daySlotsLoading = ref(false);

function venueTypeName(t: string) {
  const m: Record<string, string> = { report_hall: '报告厅', meeting_room: '会议室', activity_center: '活动中心' };
  return m[t] || t;
}

function photoSrc(path: string) {
  if (!path) return '';
  return path.startsWith('/') ? path : `/${path}`;
}

function disabledDate(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() < today.getTime();
}

function timeToMinutes(t: string): number {
  const [h, m] = (t.slice(0, 5).match(/\d+/g) || ['0', '0']).map(Number);
  return h * 60 + m;
}

function minutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const timelineRange = computed(() => {
  if (!venue.value) return { openMin: 0, closeMin: 24 * 60, totalMin: 24 * 60 };
  const openMin = venue.value.openTime ? timeToMinutes(venue.value.openTime.slice(0, 5)) : 0;
  const closeMin = venue.value.closeTime ? timeToMinutes(venue.value.closeTime.slice(0, 5)) : 24 * 60;
  return { openMin, closeMin, totalMin: closeMin - openMin || 1 };
});

const timelineAxisLabels = computed(() => {
  const { openMin, closeMin } = timelineRange.value;
  const labels: string[] = [];
  for (let min = openMin; min <= closeMin; min += 60) {
    labels.push(minutesToTime(min));
  }
  return labels;
});

function axisLabelPosition(t: string): number {
  const min = timeToMinutes(t);
  const { openMin, totalMin } = timelineRange.value;
  return Math.max(0, Math.min(100, ((min - openMin) / totalMin) * 100));
}

const timelineSegments = computed(() => {
  if (!venue.value || !daySlots.value || !selectedDate.value) return [];
  const { openMin, closeMin, totalMin } = timelineRange.value;
  const step = 60;
  const todayStr = new Date().toISOString().slice(0, 10);
  const isToday = selectedDate.value === todayStr;
  const nowMinutes = isToday ? new Date().getHours() * 60 + new Date().getMinutes() : -1;
  const segs: {
    start: string;
    end: string;
    status: 'free' | 'booked' | 'unavailable';
    activityName?: string;
    leftPercent: number;
    widthPercent: number;
  }[] = [];
  for (let min = openMin; min < closeMin; min += step) {
    const start = minutesToTime(min);
    const end = minutesToTime(Math.min(min + step, closeMin));
    let status: 'free' | 'booked' | 'unavailable' = 'free';
    let activityName: string | undefined;
    const startMin = min;
    const endMin = min + step;
    if (isToday && nowMinutes >= 0 && endMin <= nowMinutes) {
      status = 'unavailable';
    } else {
      for (const u of daySlots.value.unavailableSlots) {
        const uStart = timeToMinutes(u.startTime);
        const uEnd = timeToMinutes(u.endTime);
        if (uStart < endMin && uEnd > startMin) {
          status = 'unavailable';
          break;
        }
      }
      if (status !== 'unavailable') {
        for (const b of daySlots.value.bookings) {
          const bStart = timeToMinutes(b.startTime);
          const bEnd = timeToMinutes(b.endTime);
          if (bStart < endMin && bEnd > startMin) {
            status = 'booked';
            activityName = b.activityName;
            break;
          }
        }
      }
    }
    const leftPercent = ((startMin - openMin) / totalMin) * 100;
    const widthPercent = ((Math.min(endMin, closeMin) - startMin) / totalMin) * 100;
    segs.push({ start, end, status, activityName, leftPercent, widthPercent });
  }
  return segs;
});

async function onDateChange(date: string | null) {
  if (!date || !venue.value) {
    daySlots.value = null;
    return;
  }
  daySlotsLoading.value = true;
  daySlots.value = null;
  try {
    const res = await getVenueDaySlots(venue.value.id, date);
    const data = (res as any)?.data ?? res;
    daySlots.value = Array.isArray(data?.bookings)
      ? { bookings: data.bookings, unavailableSlots: data.unavailableSlots || [] }
      : { bookings: [], unavailableSlots: [] };
  } catch {
    daySlots.value = { bookings: [], unavailableSlots: [] };
  } finally {
    daySlotsLoading.value = false;
  }
}

onMounted(async () => {
  venue.value = await getVenue(venueId.value);
});
</script>

<style scoped>
.venue-photos-section { margin-bottom: 20px; }
.venue-photos-section h3 { font-size: 14px; color: #666; margin-bottom: 12px; }
.venue-photos-list { display: flex; flex-wrap: wrap; gap: 12px; }
.venue-photo-item { display: block; width: 120px; height: 120px; border-radius: 8px; overflow: hidden; border: 1px solid #eee; }
.venue-photo-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
.venue-photo-item:hover { border-color: #409eff; }

.day-timeline-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}
.day-timeline-section h3 { font-size: 16px; margin-bottom: 12px; }
.date-picker-row { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
.date-picker-row .label { color: #666; }
.timeline-loading { padding: 24px; text-align: center; color: #666; }
.timeline-wrap { margin-top: 8px; }
.timeline-title { font-size: 14px; color: #666; margin-bottom: 12px; }
.timeline-horizontal {
  width: 100%;
  min-width: 320px;
  overflow-x: auto;
}
.timeline-axis {
  position: relative;
  height: 24px;
  margin-bottom: 4px;
  border-bottom: 1px solid #dcdfe6;
}
.timeline-axis .axis-tick {
  position: absolute;
  transform: translateX(-50%);
  font-size: 12px;
  color: #909399;
}
.timeline-track {
  position: relative;
  height: 48px;
  background: #f5f7fa;
  border-radius: 8px;
  min-width: 400px;
}
.timeline-track .timeline-seg.horizontal {
  position: absolute;
  top: 4px;
  bottom: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  overflow: hidden;
  white-space: nowrap;
}
.timeline-track .timeline-seg .seg-label {
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 4px;
}
.timeline-seg.free { background: #e1f3d8; color: #67c23a; }
.timeline-seg.booked { background: #fde2e2; color: #f56c6c; }
.timeline-seg.unavailable { background: #e9e9eb; color: #909399; }
.timeline-legend {
  margin-top: 12px;
  font-size: 12px;
  color: #666;
  display: flex;
  gap: 16px;
}
.timeline-legend .legend-item::before {
  content: '';
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
  margin-right: 6px;
  vertical-align: middle;
}
.timeline-legend .legend-item.free::before { background: #e1f3d8; }
.timeline-legend .legend-item.booked::before { background: #fde2e2; }
.timeline-legend .legend-item.unavailable::before { background: #e9e9eb; }
.hint { color: #999; font-size: 13px; margin-top: 8px; }
</style>
