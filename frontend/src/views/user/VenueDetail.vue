<template>
  <div class="page">
    <el-button link @click="$router.push('/user/venue-list')">← 返回列表</el-button>
    <el-card v-if="venue" style="margin-top: 16px">
      <h2>{{ venue.name }}</h2>
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

onMounted(async () => {
  venue.value = await getVenue(venueId.value);
});
</script>
