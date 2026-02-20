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
import { useRoute } from 'vue-router';
import { getVenue } from '@/api/venue';
import type { Venue } from '@/types';

const route = useRoute();
const venue = ref<Venue | null>(null);
const venueId = computed(() => Number(route.params.id));

function venueTypeName(t: string) {
  const m: Record<string, string> = { report_hall: '报告厅', meeting_room: '会议室', activity_center: '活动中心' };
  return m[t] || t;
}

function photoSrc(path: string) {
  if (!path) return '';
  return path.startsWith('/') ? path : `/${path}`;
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
</style>
