<template>
  <div class="page">
    <h2>场地管理</h2>
    <el-table :data="list" v-loading="loading" border>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="name" label="名称" width="140" />
      <el-table-column prop="venueType" label="类型" width="100">
        <template #default="{ row }">{{ venueTypeName(row.venueType) }}</template>
      </el-table-column>
      <el-table-column prop="capacity" label="容量" width="80" />
      <el-table-column prop="location" label="位置" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.isAvailable ? 'success' : 'info'">{{ row.isAvailable ? '可用' : '不可用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="edit(row)">编辑</el-button>
          <el-button link @click="showSlots(row)">不可用时段</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="editVisible" title="编辑场地" width="500px" @close="editForm = null">
      <el-form v-if="editForm" :model="editForm" label-width="100px">
        <el-form-item label="名称"><el-input v-model="editForm.name" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="editForm.address" /></el-form-item>
        <el-form-item label="可用">
          <el-switch v-model="editForm.isAvailable" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="slotVisible" title="添加不可用时段" width="400px">
      <el-form :model="slotForm" label-width="80px">
        <el-form-item label="开始时间">
          <el-date-picker v-model="slotForm.startTime" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" placeholder="选择" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker v-model="slotForm.endTime" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" placeholder="选择" style="width: 100%" />
        </el-form-item>
        <el-form-item label="原因"><el-input v-model="slotForm.reason" placeholder="如：设备维护" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="slotVisible = false">取消</el-button>
        <el-button type="primary" :loading="slotSaving" @click="addSlot">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getManagedVenues, updateVenue, addUnavailableSlot } from '@/api/venue';
import type { Venue } from '@/types';

const list = ref<Venue[]>([]);
const loading = ref(false);
const editVisible = ref(false);
const editForm = ref<{ id: number; name: string; address: string | null; isAvailable: number } | null>(null);
const saving = ref(false);
const slotVisible = ref(false);
const slotForm = reactive({ venueId: 0, startTime: '', endTime: '', reason: '' });
const slotSaving = ref(false);

function venueTypeName(t: string) {
  const m: Record<string, string> = { report_hall: '报告厅', meeting_room: '会议室', activity_center: '活动中心' };
  return m[t] || t;
}

async function load() {
  loading.value = true;
  try {
    const managed = (await getManagedVenues()) as unknown as Venue[];
    list.value = Array.isArray(managed) ? managed : [];
  } finally {
    loading.value = false;
  }
}

function edit(row: Venue) {
  editForm.value = { id: row.id, name: row.name, address: row.address ?? '', isAvailable: row.isAvailable };
  editVisible.value = true;
}

async function saveEdit() {
  if (!editForm.value) return;
  saving.value = true;
  try {
    await updateVenue(editForm.value.id, {
      name: editForm.value.name,
      address: editForm.value.address || undefined,
      isAvailable: editForm.value.isAvailable,
    });
    ElMessage.success('已保存');
    editVisible.value = false;
    load();
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

function showSlots(row: Venue) {
  slotForm.venueId = row.id;
  slotForm.startTime = '';
  slotForm.endTime = '';
  slotForm.reason = '';
  slotVisible.value = true;
}

async function addSlot() {
  if (!slotForm.startTime || !slotForm.endTime) {
    ElMessage.warning('请选择开始和结束时间');
    return;
  }
  slotSaving.value = true;
  try {
    await addUnavailableSlot(slotForm.venueId, {
      startTime: slotForm.startTime,
      endTime: slotForm.endTime,
      reason: slotForm.reason || undefined,
    });
    ElMessage.success('已添加');
    slotVisible.value = false;
  } catch (e: any) {
    ElMessage.error(e?.message || '添加失败');
  } finally {
    slotSaving.value = false;
  }
}

onMounted(load);
</script>

