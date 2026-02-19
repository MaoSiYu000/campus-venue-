<template>
  <div class="page venue-manage-page">
    <h2 class="page-title">场地管理（全局）</h2>

    <div class="toolbar card-toolbar">
      <div class="toolbar-row">
        <span class="toolbar-label">添加</span>
        <el-button @click="openAdd">手动添加</el-button>
        <el-button @click="downloadTemplate">下载 Excel 模板</el-button>
        <el-upload :show-file-list="false" accept=".xlsx,.xls" :before-upload="onImportFile">
          <el-button :loading="importing">Excel 导入</el-button>
        </el-upload>
        <el-button @click="restoreTestVenues">恢复测试场地</el-button>
      </div>
      <div class="toolbar-row">
        <span class="toolbar-label">删除</span>
        <el-button @click="clearWithConfirm('keepTest')">一键清空（保留测试）</el-button>
        <el-button @click="clearWithConfirm('clearAll')">完全清空</el-button>
        <el-button :disabled="selectedIds.length === 0" @click="clearWithConfirm('selected')">删除选中</el-button>
      </div>
    </div>

    <div class="filter-bar card-filter">
      <div class="filter-title">筛选条件</div>
      <el-form :model="filters" inline class="filter-form">
        <el-form-item label="类型">
          <el-select v-model="filters.venue_type" clearable placeholder="全部" style="width: 120px">
            <el-option label="报告厅" value="report_hall" />
            <el-option label="会议室" value="meeting_room" />
            <el-option label="活动中心" value="activity_center" />
          </el-select>
        </el-form-item>
        <el-form-item label="可用状态">
          <el-select v-model="filters.is_available" clearable placeholder="全部" style="width: 100px">
            <el-option label="可用" :value="true" />
            <el-option label="不可用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="容量">
          <el-input-number v-model="filters.capacity_min" :min="0" placeholder="最小" controls-position="right" style="width: 100px" />
          <span class="filter-sep">至</span>
          <el-input-number v-model="filters.capacity_max" :min="0" placeholder="最大" controls-position="right" style="width: 100px" />
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="filters.name" placeholder="关键词" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="applyFilter">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-wrap">
      <el-table :data="filteredList" v-loading="loading" border stripe @selection-change="onSelectionChange">
      <el-table-column type="selection" width="50" />
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="name" label="名称" width="140" />
      <el-table-column prop="venueType" label="类型" width="100">
        <template #default="{ row }">{{ venueTypeName(row.venueType) }}</template>
      </el-table-column>
      <el-table-column prop="capacity" label="容量" width="80" />
      <el-table-column prop="address" label="地址" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.isAvailable ? 'success' : 'info'">{{ row.isAvailable ? '可用' : '不可用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="edit(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>
    </div>

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
    <el-dialog v-model="addVisible" title="手动添加场地" width="480px" @close="resetAddForm">
      <el-form :model="addForm" label-width="100px">
        <el-form-item label="名称" required><el-input v-model="addForm.name" placeholder="场地名称" /></el-form-item>
        <el-form-item label="类型" required>
          <el-select v-model="addForm.venueType" placeholder="请选择" style="width: 100%">
            <el-option label="报告厅" value="report_hall" />
            <el-option label="会议室" value="meeting_room" />
            <el-option label="活动中心" value="activity_center" />
          </el-select>
        </el-form-item>
        <el-form-item label="容量" required>
          <el-input-number v-model="addForm.capacity" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="地址"><el-input v-model="addForm.address" placeholder="选填" /></el-form-item>
        <el-form-item label="可用"><el-switch v-model="addForm.isAvailable" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addVisible = false">取消</el-button>
        <el-button type="primary" :loading="addSaving" @click="submitAdd">添加</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="clearConfirmVisible" title="确认清空场地" width="420px">
      <p v-if="clearMode === 'keepTest'">将删除除每类保留一个测试场地外的所有场地，是否继续？</p>
      <p v-else-if="clearMode === 'clearAll'">将删除所有场地，不可恢复。是否继续？</p>
      <p v-else>将删除选中的 {{ selectedIds.length }} 个场地，是否继续？</p>
      <template #footer>
        <el-button @click="clearConfirmVisible = false">取消</el-button>
        <el-button :loading="clearSaving" @click="doClear">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import {
  getVenueList,
  updateVenue,
  createVenue,
  ensureTestVenues,
  clearVenues,
  downloadVenueTemplate,
  importVenues,
} from '@/api/venue';
import type { Venue } from '@/types';

const list = ref<Venue[]>([]);
const loading = ref(false);
const selectedIds = ref<number[]>([]);
const editVisible = ref(false);
const editForm = ref<{ id: number; name: string; address: string | null; isAvailable: number } | null>(null);
const saving = ref(false);

const addVisible = ref(false);
const addSaving = ref(false);
const addForm = reactive({
  name: '',
  venueType: 'report_hall',
  capacity: 50,
  address: '',
  isAvailable: true,
});

const clearConfirmVisible = ref(false);
const clearMode = ref<'keepTest' | 'clearAll' | 'selected'>('keepTest');
const clearSaving = ref(false);
const importing = ref(false);

const filters = reactive({
  venue_type: '' as string,
  is_available: undefined as boolean | undefined,
  capacity_min: undefined as number | undefined,
  capacity_max: undefined as number | undefined,
  name: '',
});

const filteredList = computed(() => {
  let result = [...list.value];
  if (filters.name.trim()) {
    const kw = filters.name.trim().toLowerCase();
    result = result.filter((v) => (v.name || '').toLowerCase().includes(kw));
  }
  result.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'zh-CN'));
  return result;
});

function venueTypeName(t: string) {
  const m: Record<string, string> = { report_hall: '报告厅', meeting_room: '会议室', activity_center: '活动中心' };
  return m[t] || t;
}

function onSelectionChange(rows: Venue[]) {
  selectedIds.value = rows.map((r) => r.id);
}

function buildParams() {
  const params: Record<string, string | number | boolean | undefined> = {};
  if (filters.venue_type) params.venue_type = filters.venue_type;
  if (filters.is_available !== undefined) params.is_available = filters.is_available;
  if (filters.capacity_min != null && filters.capacity_min > 0) params.min_capacity = filters.capacity_min;
  if (filters.capacity_max != null && filters.capacity_max > 0) params.max_capacity = filters.capacity_max;
  return params;
}

function applyFilter() {
  load();
}

function resetFilter() {
  filters.venue_type = '';
  filters.is_available = undefined;
  filters.capacity_min = undefined;
  filters.capacity_max = undefined;
  filters.name = '';
  load();
}

async function load() {
  loading.value = true;
  try {
    const params = buildParams();
    list.value = (await getVenueList(params)) as unknown as Venue[];
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
      isAvailable: editForm.value.isAvailable === 1,
    } as any);
    ElMessage.success('已保存');
    editVisible.value = false;
    load();
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

function openAdd() {
  resetAddForm();
  addVisible.value = true;
}

function resetAddForm() {
  addForm.name = '';
  addForm.venueType = 'report_hall';
  addForm.capacity = 50;
  addForm.address = '';
  addForm.isAvailable = true;
}

async function submitAdd() {
  if (!addForm.name.trim()) {
    ElMessage.warning('请填写名称');
    return;
  }
  addSaving.value = true;
  try {
    await createVenue({
      name: addForm.name.trim(),
      venueType: addForm.venueType,
      capacity: addForm.capacity,
      address: addForm.address.trim() || undefined,
      isAvailable: addForm.isAvailable,
    } as any);
    ElMessage.success('添加成功');
    addVisible.value = false;
    load();
  } catch (e: any) {
    ElMessage.error(e?.message || '添加失败');
  } finally {
    addSaving.value = false;
  }
}

async function restoreTestVenues() {
  try {
    const res = await ensureTestVenues();
    if (res.created > 0) {
      ElMessage.success(`已恢复 ${res.created} 个测试场地`);
      load();
    } else {
      ElMessage.info('测试场地已存在，无需恢复');
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '恢复失败');
  }
}

async function downloadTemplate() {
  try {
    await downloadVenueTemplate();
    ElMessage.success('模板已下载');
  } catch (e: any) {
    ElMessage.error(e?.message || '下载失败');
  }
}

function clearWithConfirm(mode: 'keepTest' | 'clearAll' | 'selected') {
  clearMode.value = mode;
  if (mode === 'selected' && selectedIds.value.length === 0) {
    ElMessage.warning('请先勾选要删除的场地');
    return;
  }
  clearConfirmVisible.value = true;
}

async function doClear() {
  clearSaving.value = true;
  try {
    if (clearMode.value === 'keepTest') await clearVenues({ keepTestOnly: true });
    else if (clearMode.value === 'clearAll') await clearVenues({ clearAll: true });
    else await clearVenues({ venueIds: selectedIds.value });
    ElMessage.success('操作成功');
    clearConfirmVisible.value = false;
    load();
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败');
  } finally {
    clearSaving.value = false;
  }
}

async function onImportFile(file: File) {
  if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
    ElMessage.warning('请上传 .xlsx 或 .xls 文件');
    return false;
  }
  importing.value = true;
  try {
    const res = await importVenues(file);
    const msg = `导入完成：新增 ${res.created} 个场地${res.errors?.length ? '；' + res.errors.slice(0, 3).join('；') : ''}`;
    ElMessage.success(msg);
    if (res.errors?.length) console.warn('导入警告', res.errors);
    load();
  } catch (e: any) {
    ElMessage.error(e?.message || '导入失败');
  } finally {
    importing.value = false;
  }
  return false;
}

onMounted(load);
</script>

<style scoped>
.venue-manage-page {
  padding: 16px 20px;
  background: #f5f7fa;
  min-height: 100%;
}
.page-title {
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}
.card-toolbar,
.card-filter {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px 16px;
  margin-bottom: 16px;
}
.card-toolbar {
  padding: 14px 16px;
}
.toolbar { display: flex; flex-direction: column; gap: 10px; }
.toolbar-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.toolbar-label { margin-right: 8px; color: #909399; font-size: 13px; min-width: 36px; }

.filter-bar { margin-bottom: 16px; }
.filter-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}
.filter-form :deep(.el-form-item) { margin-bottom: 0; margin-right: 16px; }
.filter-form :deep(.el-form-item__label) { color: #606266; }
.filter-sep { margin: 0 8px; color: #909399; font-size: 12px; }

.table-wrap {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 16px;
}
.table-wrap :deep(.el-table) { font-size: 13px; }
.table-wrap :deep(.el-table th) { background: #f5f7fa; color: #606266; font-weight: 500; }
</style>
