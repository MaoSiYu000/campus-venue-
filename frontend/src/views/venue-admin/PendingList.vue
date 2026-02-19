<template>
  <div class="page">
    <h2>待处理申请</h2>
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
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="showDetail(row)">详情</el-button>
          <el-button link type="success" @click="approve(row)">通过</el-button>
          <el-button link type="danger" @click="reject(row)">驳回</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="detailVisible" title="申请详情" width="560px">
      <el-descriptions v-if="current" :column="1" border>
        <el-descriptions-item label="场地">{{ current.venue?.name }}</el-descriptions-item>
        <el-descriptions-item label="使用时间">{{ current.useDate }} {{ current.startTime }}-{{ current.endTime }}</el-descriptions-item>
        <el-descriptions-item label="活动名称">{{ current.activityName }}</el-descriptions-item>
        <el-descriptions-item label="主办单位">{{ current.organizer }}</el-descriptions-item>
        <el-descriptions-item label="预计人数">{{ current.estimatedPeople }}</el-descriptions-item>
        <el-descriptions-item label="负责人">{{ current.contactName }} {{ current.contactPhone }}</el-descriptions-item>
        <el-descriptions-item label="说明">{{ current.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="策划书">
          <a v-if="current.proposalDocumentPath" :href="current.proposalDocumentPath" target="_blank">查看</a>
          <span v-else>-</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
    <el-dialog v-model="rejectVisible" title="驳回理由" width="400px">
      <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="必填" />
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" :loading="submitting" @click="doReject">确认驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getPendingList, approveBooking, rejectBooking } from '@/api/booking';
import type { BookingApplication } from '@/types';

const list = ref<BookingApplication[]>([]);
const loading = ref(false);
const detailVisible = ref(false);
const current = ref<BookingApplication | null>(null);
const rejectVisible = ref(false);
const rejectReason = ref('');
const submitting = ref(false);

async function load() {
  loading.value = true;
  try {
    list.value = await getPendingList();
  } finally {
    loading.value = false;
  }
}

function showDetail(row: BookingApplication) {
  current.value = row;
  detailVisible.value = true;
}

async function approve(row: BookingApplication) {
  await ElMessageBox.confirm('确定通过该申请？', '提示');
  try {
    await approveBooking(row.id);
    ElMessage.success('已通过');
    load();
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败');
  }
}

function reject(row: BookingApplication) {
  current.value = row;
  rejectReason.value = '';
  rejectVisible.value = true;
}

async function doReject() {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请填写驳回理由');
    return;
  }
  if (!current.value) return;
  submitting.value = true;
  try {
    await rejectBooking(current.value.id, rejectReason.value);
    ElMessage.success('已驳回');
    rejectVisible.value = false;
    load();
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败');
  } finally {
    submitting.value = false;
  }
}

onMounted(load);
</script>
