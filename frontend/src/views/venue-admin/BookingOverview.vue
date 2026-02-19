<template>
  <div class="page">
    <h2>预约总览</h2>
    <el-table :data="list" v-loading="loading" border>
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
          <el-tag :type="row.status === 'approved' ? 'success' : 'warning'">{{ row.status === 'approved' ? '已通过' : '待审核' }}</el-tag>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getOverview } from '@/api/booking';

const list = ref<any[]>([]);
const loading = ref(false);

onMounted(async () => {
  loading.value = true;
  try {
    list.value = await getOverview();
  } finally {
    loading.value = false;
  }
});
</script>
