<template>
  <div class="page">
    <h2>审批记录</h2>
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
          <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="approvedAt" label="审批时间" width="160" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getHistoryList } from '@/api/booking';
import type { BookingApplication, BookingStatus } from '@/types';

const list = ref<BookingApplication[]>([]);
const loading = ref(false);

function statusText(s: BookingStatus) {
  const m: Record<BookingStatus, string> = { pending: '待审核', approved: '已通过', rejected: '已驳回', used: '已使用', cancelled: '已取消' };
  return m[s] || s;
}

function statusType(s: BookingStatus) {
  const m: Record<BookingStatus, string> = { pending: 'warning', approved: 'success', rejected: 'danger', used: 'info', cancelled: 'info' };
  return m[s] || 'info';
}

onMounted(async () => {
  loading.value = true;
  try {
    list.value = await getHistoryList();
  } finally {
    loading.value = false;
  }
});
</script>
