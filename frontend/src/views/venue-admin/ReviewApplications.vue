<template>
  <div class="page">
    <header class="page-banner">
      <h2>审核申请</h2>
    </header>
    <div class="page-content">
      <el-tabs v-model="activeTab" class="review-tabs">
        <el-tab-pane label="待审核" name="pending">
          <div class="tab-pane-inner">
            <el-table :data="pendingList" v-loading="pendingLoading" border>
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
              <el-button link type="danger" @click="openReject(row)">驳回</el-button>
            </template>
          </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
        <el-tab-pane label="审批记录" name="history">
          <div class="tab-pane-inner">
            <el-table :data="historyList" v-loading="historyLoading" border>
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
        </el-tab-pane>
      </el-tabs>

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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getPendingList, getHistoryList, approveBooking, rejectBooking } from '@/api/booking';
import type { BookingApplication, BookingStatus } from '@/types';

const activeTab = ref<'pending' | 'history'>('pending');
const pendingList = ref<BookingApplication[]>([]);
const historyList = ref<BookingApplication[]>([]);
const pendingLoading = ref(false);
const historyLoading = ref(false);
const detailVisible = ref(false);
const current = ref<BookingApplication | null>(null);
const rejectVisible = ref(false);
const rejectReason = ref('');
const submitting = ref(false);

function statusText(s: BookingStatus) {
  const m: Record<BookingStatus, string> = { pending: '待审核', approved: '已通过', rejected: '已驳回', used: '已使用', cancelled: '已取消' };
  return m[s] || s;
}

function statusType(s: BookingStatus) {
  const m: Record<BookingStatus, string> = { pending: 'warning', approved: 'success', rejected: 'danger', used: 'info', cancelled: 'info' };
  return m[s] || 'info';
}

async function loadPending() {
  pendingLoading.value = true;
  try {
    pendingList.value = await getPendingList();
  } finally {
    pendingLoading.value = false;
  }
}

async function loadHistory() {
  historyLoading.value = true;
  try {
    historyList.value = await getHistoryList();
  } finally {
    historyLoading.value = false;
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
    loadPending();
    loadHistory();
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败');
  }
}

function openReject(row: BookingApplication) {
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
    loadPending();
    loadHistory();
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败');
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  loadPending();
  loadHistory();
});
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
.page-banner h2 { margin: 0; font-size: 32px; color: #fff; position: relative; z-index: 1; }
.page-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow: hidden;
}
.review-tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
/* 页签栏：白色一行，固定在数据表格上方 */
.review-tabs :deep(.el-tabs__header) {
  order: 0;
  margin: 0 0 0 0;
  padding: 0 16px;
  background: #fff;
  border-radius: 8px 8px 0 0;
  border: 1px solid #ebeef5;
  border-bottom: none;
  flex-shrink: 0;
}
.review-tabs :deep(.el-tabs__nav-wrap) { background: #fff; }
.review-tabs :deep(.el-tabs__nav) { border: none; }
.review-tabs :deep(.el-tabs__item) { color: #606266; }
.review-tabs :deep(.el-tabs__item.is-active) { color: #325ba7; font-weight: 600; }
.review-tabs :deep(.el-tabs__active-bar) { background-color: #325ba7; }
.review-tabs :deep(.el-tabs__ink-bar) { background-color: #325ba7; }
.review-tabs :deep(.el-tabs__content) {
  order: 1;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 0 0 8px 8px;
  padding: 12px;
}
.tab-pane-inner {
  min-height: 100%;
}
</style>
