<template>
  <div class="page">
    <h2>我的预约</h2>
    <el-table :data="list" v-loading="loading" border>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="场地" width="120">
        <template #default="{ row }">{{ row.venue?.name || '-' }}</template>
      </el-table-column>
      <el-table-column prop="useDate" label="使用日期" width="110" />
      <el-table-column label="时间段" width="120">
        <template #default="{ row }">{{ row.startTime }} - {{ row.endTime }}</template>
      </el-table-column>
      <el-table-column prop="activityName" label="活动名称" min-width="120" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          <span v-if="row.status === 'rejected' && row.rejectReason" class="reject">（{{ row.rejectReason }}）</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="showDetail(row)">详情</el-button>
          <el-button
            v-if="canCancel(row)"
            link
            type="danger"
            @click="cancel(row)"
          >取消</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="detailVisible" title="预约详情" width="560px">
      <el-descriptions v-if="current" :column="1" border>
        <el-descriptions-item label="场地">{{ current.venue?.name }}</el-descriptions-item>
        <el-descriptions-item label="使用日期">{{ current.useDate }} {{ current.startTime }}-{{ current.endTime }}</el-descriptions-item>
        <el-descriptions-item label="活动名称">{{ current.activityName }}</el-descriptions-item>
        <el-descriptions-item label="主办单位">{{ current.organizer }}</el-descriptions-item>
        <el-descriptions-item label="预计人数">{{ current.estimatedPeople }}</el-descriptions-item>
        <el-descriptions-item label="负责人">{{ current.contactName }} {{ current.contactPhone }}</el-descriptions-item>
        <el-descriptions-item label="说明">{{ current.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ statusText(current.status) }}</el-descriptions-item>
        <el-descriptions-item v-if="current.rejectReason" label="驳回原因">{{ current.rejectReason }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getMyBookings, cancelBooking } from '@/api/booking';
import type { BookingApplication, BookingStatus } from '@/types';

const list = ref<BookingApplication[]>([]);
const loading = ref(false);
const detailVisible = ref(false);
const current = ref<BookingApplication | null>(null);

function statusText(s: BookingStatus) {
  const m: Record<BookingStatus, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已驳回',
    used: '已使用',
    cancelled: '已取消',
  };
  return m[s] || s;
}

function statusType(s: BookingStatus) {
  const m: Record<BookingStatus, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    used: 'info',
    cancelled: 'info',
  };
  return m[s] || 'info';
}

function canCancel(row: BookingApplication) {
  if (row.status !== 'pending' && row.status !== 'approved') return false;
  const useStart = new Date(`${row.useDate} ${row.startTime}`);
  return useStart > new Date();
}

async function load() {
  loading.value = true;
  try {
    list.value = await getMyBookings();
  } finally {
    loading.value = false;
  }
}

function showDetail(row: BookingApplication) {
  current.value = row;
  detailVisible.value = true;
}

async function cancel(row: BookingApplication) {
  await ElMessageBox.confirm('确定取消该预约？', '提示');
  try {
    await cancelBooking(row.id);
    ElMessage.success('已取消');
    load();
  } catch (e: any) {
    ElMessage.error(e?.message || '取消失败');
  }
}

onMounted(load);
</script>

<style scoped>
.reject { font-size: 12px; color: #f56c6c; }
</style>
