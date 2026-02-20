<template>
  <div class="page">
    <h2>场地列表</h2>
    <el-card class="filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="类型">
          <el-select v-model="filters.venue_type" clearable placeholder="全部" style="width: 120px">
            <el-option label="报告厅" value="report_hall" />
            <el-option label="会议室" value="meeting_room" />
            <el-option label="活动中心" value="activity_center" />
          </el-select>
        </el-form-item>
        <el-form-item label="容量">
          <el-input-number v-model="filters.min_capacity" :min="0" placeholder="最小" style="width: 100px" />
          -
          <el-input-number v-model="filters.max_capacity" :min="0" placeholder="最大" style="width: 100px" />
        </el-form-item>
        <el-form-item label="位置">
          <el-input v-model="filters.location" placeholder="楼栋/区域" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="设备">
          <el-checkbox v-model="filters.has_projector">投影</el-checkbox>
          <el-checkbox v-model="filters.has_sound">音响</el-checkbox>
        </el-form-item>
        <el-form-item label="可用">
          <el-select v-model="filters.is_available" clearable placeholder="全部" style="width: 100px">
            <el-option label="可用" :value="true" />
            <el-option label="不可用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="load">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col v-for="v in list" :key="v.id" :span="8">
        <el-card shadow="hover" class="venue-card" @click="goDetail(v.id)">
          <div class="venue-photo-wrap">
            <img v-if="v.photos?.length" :src="photoSrc(v.photos[0])" alt="" class="venue-photo" />
            <div v-else class="venue-photo placeholder">暂无照片</div>
          </div>
          <div class="name">{{ v.name }}</div>
          <div class="meta">类型：{{ venueTypeName(v.venueType) }} | 容量 {{ v.capacity }} 人</div>
          <div class="meta">位置：{{ v.location || '-' }}</div>
          <div class="meta">
            设备：{{ v.hasProjector ? '投影 ' : '' }}{{ v.hasSound ? '音响' : '' }} {{ !v.hasProjector && !v.hasSound ? '无' : '' }}
          </div>
          <el-tag :type="v.isAvailable ? 'success' : 'info'" size="small">{{ v.isAvailable ? '可用' : '不可用' }}</el-tag>
        </el-card>
      </el-col>
    </el-row>
    <el-empty v-if="!loading && !list.length" description="暂无场地" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getVenueList, type VenueFilters } from '@/api/venue';
import type { Venue } from '@/types';

const router = useRouter();
const list = ref<Venue[]>([]);
const loading = ref(false);
const filters = reactive<Record<string, any>>({
  venue_type: '',
  min_capacity: undefined,
  max_capacity: undefined,
  location: '',
  has_projector: undefined,
  has_sound: undefined,
  is_available: undefined,
});

function venueTypeName(t: string) {
  const m: Record<string, string> = { report_hall: '报告厅', meeting_room: '会议室', activity_center: '活动中心' };
  return m[t] || t;
}

function photoSrc(path: string) {
  if (!path) return '';
  return path.startsWith('/') ? path : `/${path}`;
}

function resetFilters() {
  filters.venue_type = '';
  filters.min_capacity = undefined;
  filters.max_capacity = undefined;
  filters.location = '';
  filters.has_projector = undefined;
  filters.has_sound = undefined;
  filters.is_available = undefined;
  load();
}

async function load() {
  loading.value = true;
  try {
    const params: VenueFilters = {};
    if (filters.venue_type) params.venue_type = filters.venue_type;
    if (filters.min_capacity != null) params.min_capacity = filters.min_capacity;
    if (filters.max_capacity != null) params.max_capacity = filters.max_capacity;
    if (filters.location) params.location = filters.location;
    if (filters.has_projector === true) params.has_projector = true;
    if (filters.has_sound === true) params.has_sound = true;
    if (filters.is_available !== undefined) params.is_available = filters.is_available;
    list.value = await getVenueList(params);
  } finally {
    loading.value = false;
  }
}

function goDetail(id: number) {
  router.push(`/user/venue/${id}`);
}

onMounted(load);
</script>

<style scoped>
.venue-card { cursor: pointer; margin-bottom: 16px; }
.venue-photo-wrap { margin: -20px -20px 12px -20px; border-radius: 4px 4px 0 0; overflow: hidden; }
.venue-photo { width: 100%; height: 140px; object-fit: cover; display: block; }
.venue-photo.placeholder { height: 140px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 13px; color: #999; }
.venue-card .name { font-weight: bold; margin-bottom: 8px; }
.venue-card .meta { font-size: 12px; color: #666; margin: 4px 0; }
</style>
