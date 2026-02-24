<template>
  <div class="page account-manage-page">
    <h2 class="page-title">账号管理</h2>

    <div class="toolbar card-toolbar">
      <div class="toolbar-row">
        <span class="toolbar-label">添加</span>
        <el-button @click="openAddAccount">手动添加</el-button>
        <el-button @click="downloadTemplate">下载 Excel 模板</el-button>
        <el-upload :show-file-list="false" accept=".xlsx,.xls" :before-upload="onImportFile">
          <el-button :loading="importing">批量导入</el-button>
        </el-upload>
        <el-button @click="restoreTestAccounts">恢复测试账号</el-button>
      </div>
      <div class="toolbar-row">
        <span class="toolbar-label">清空</span>
        <el-button @click="clearWithConfirm('keepTest')">一键清空（保留测试）</el-button>
        <el-button @click="clearWithConfirm('clearAll')">完全清空</el-button>
        <el-button :disabled="selectedUserIds.length === 0 && selectedVenueAdminIds.length === 0" @click="clearWithConfirm('selected')">删除选中</el-button>
      </div>
    </div>

    <div class="filter-bar card-filter">
      <div class="filter-title">筛选条件</div>
      <el-form :model="filters" inline class="filter-form">
        <el-form-item :label="activeTab === 'users' ? '学号' : '工号'">
          <el-input
            v-model="filters.keywordId"
            :placeholder="activeTab === 'users' ? '学号关键词' : '工号关键词'"
            clearable
            style="width: 140px"
          />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="filters.keywordName" placeholder="姓名关键词" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="applyFilter">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-wrap">
      <el-tabs v-model="activeTab" class="account-tabs">
        <el-tab-pane label="学生/老师" name="users">
          <el-table :data="filteredUsers" border stripe @selection-change="onUserSelectionChange">
            <el-table-column type="selection" width="50" />
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="studentId" label="学号" width="120" />
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column prop="phone" label="电话" />
            <el-table-column label="操作" width="140">
              <template #default="{ row }">
                <el-button link type="primary" @click="openNotify('user', row.id, row.studentId)">发送通知</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="场地管理员" name="venueAdmins">
          <el-table :data="filteredVenueAdmins" border stripe @selection-change="onVenueAdminSelectionChange">
            <el-table-column type="selection" width="50" />
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="workId" label="工号" width="100" />
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column label="管辖场地">
              <template #default="{ row }">{{ (row.venues || []).map((v: any) => v.name).join('、') || '-' }}</template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button link type="primary" @click="openNotify('venue_admin', row.id, row.workId)">发送通知</el-button>
                <el-button link @click="openScope(row)">管辖范围</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>
    <el-dialog v-model="notifyVisible" title="发送通知" width="440px">
      <el-form :model="notifyForm" label-width="80px">
        <el-form-item label="标题"><el-input v-model="notifyForm.title" /></el-form-item>
        <el-form-item label="内容"><el-input v-model="notifyForm.content" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="notifyVisible = false">取消</el-button>
        <el-button type="primary" :loading="notifySaving" @click="sendNotify">发送</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="clearConfirmVisible" title="确认清空账号" width="440px">
      <template v-if="clearMode === 'keepTest' || clearMode === 'clearAll'">
        <p class="clear-dialog-desc">清空范围：</p>
        <el-radio-group v-model="clearScope" class="clear-scope-group">
          <el-radio value="users">仅学生/老师</el-radio>
          <el-radio value="venue_admins">仅场地管理员</el-radio>
          <el-radio value="both">全部（学生/老师 + 场地管理员）</el-radio>
        </el-radio-group>
        <p class="clear-dialog-desc" v-if="clearMode === 'keepTest'">将删除所选范围内除测试账号外的账号，是否继续？</p>
        <p class="clear-dialog-desc" v-else>将完全清空所选范围内所有账号，不可恢复。是否继续？</p>
      </template>
      <p v-else>将删除选中的 {{ selectedUserIds.length }} 个学生、{{ selectedVenueAdminIds.length }} 个场地管理员，是否继续？</p>
      <template #footer>
        <el-button @click="clearConfirmVisible = false">取消</el-button>
        <el-button :loading="clearSaving" @click="doClear">确认</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="scopeVisible" title="修改管辖范围" width="400px">
      <p>当前管理员：{{ scopeTarget?.name }}（{{ scopeTarget?.workId }}）</p>
      <el-checkbox-group v-model="scopeVenueIds">
        <div v-for="v in allVenues" :key="v.id" style="margin: 6px 0">
          <el-checkbox :label="v.id">{{ v.name }}</el-checkbox>
        </div>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="scopeVisible = false">取消</el-button>
        <el-button type="primary" :loading="scopeSaving" @click="saveScope">保存</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="addAccountVisible" title="手动添加账号" width="420px" @close="resetAddForm">
      <el-form :model="addForm" label-width="90px">
        <el-form-item label="账号类型">
          <el-radio-group v-model="addForm.accountType">
            <el-radio value="user">学生/老师</el-radio>
            <el-radio value="venue_admin">场地管理员</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="addForm.accountType === 'user' ? '学号' : '工号'" required>
          <el-input v-model="addForm.studentIdOrWorkId" :placeholder="addForm.accountType === 'user' ? '学号' : '工号'" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="addForm.name" placeholder="选填" />
        </el-form-item>
        <el-form-item label="初始密码">
          <el-input v-model="addForm.password" type="password" placeholder="选填，默认 123456" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addAccountVisible = false">取消</el-button>
        <el-button type="primary" :loading="addAccountSaving" @click="submitAddAccount">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getUsers, getVenueAdmins, notifyUser, notifyVenueAdmin, updateVenueAdminScope, clearAccounts, ensureTestAccounts, createUser, createVenueAdmin, downloadImportTemplate, importAccounts } from '@/api/system-admin';
import { getVenueList } from '@/api/venue';

const activeTab = ref('users');
const users = ref<any[]>([]);
const venueAdmins = ref<any[]>([]);
const allVenues = ref<any[]>([]);
const selectedUserIds = ref<number[]>([]);
const selectedVenueAdminIds = ref<number[]>([]);

const filters = reactive({
  keywordId: '',
  keywordName: '',
});

const filteredUsers = computed(() => {
  let result = [...users.value];
  const kid = (filters.keywordId || '').trim().toLowerCase();
  const kn = (filters.keywordName || '').trim().toLowerCase();
  if (kid) result = result.filter((u) => (u.studentId || '').toLowerCase().includes(kid));
  if (kn) result = result.filter((u) => (u.name || '').toLowerCase().includes(kn));
  return result;
});

const filteredVenueAdmins = computed(() => {
  let result = [...venueAdmins.value];
  const kid = (filters.keywordId || '').trim().toLowerCase();
  const kn = (filters.keywordName || '').trim().toLowerCase();
  if (kid) result = result.filter((u) => (u.workId || '').toLowerCase().includes(kid));
  if (kn) result = result.filter((u) => (u.name || '').toLowerCase().includes(kn));
  return result;
});

function applyFilter() {
  // 筛选由 computed 实时生效，无需额外逻辑
}

function resetFilter() {
  filters.keywordId = '';
  filters.keywordName = '';
}
const clearConfirmVisible = ref(false);
const clearMode = ref<'keepTest' | 'clearAll' | 'selected'>('keepTest');
const clearScope = ref<'users' | 'venue_admins' | 'both'>('both');
const clearSaving = ref(false);
const importing = ref(false);

const notifyVisible = ref(false);
const notifyForm = reactive({ targetType: '' as 'user' | 'venue_admin', targetId: 0, title: '', content: '' });
const notifySaving = ref(false);

const scopeVisible = ref(false);
const scopeTarget = ref<{ id: number; workId: string; name: string } | null>(null);
const scopeVenueIds = ref<number[]>([]);
const scopeSaving = ref(false);

const addAccountVisible = ref(false);
const addAccountSaving = ref(false);
const addForm = reactive({
  accountType: 'user' as 'user' | 'venue_admin',
  studentIdOrWorkId: '',
  name: '',
  password: '',
});

function onUserSelectionChange(rows: any[]) {
  selectedUserIds.value = rows.map((r) => r.id);
}
function onVenueAdminSelectionChange(rows: any[]) {
  selectedVenueAdminIds.value = rows.map((r) => r.id);
}

async function clearWithConfirm(mode: 'keepTest' | 'clearAll' | 'selected') {
  clearMode.value = mode;
  if (mode === 'selected' && selectedUserIds.value.length === 0 && selectedVenueAdminIds.value.length === 0) {
    ElMessage.warning('请先勾选要删除的账号');
    return;
  }
  clearConfirmVisible.value = true;
}

async function doClear() {
  clearSaving.value = true;
  try {
    if (clearMode.value === 'keepTest') await clearAccounts({ keepTestOnly: true, clearScope: clearScope.value });
    else if (clearMode.value === 'clearAll') await clearAccounts({ clearAll: true, clearScope: clearScope.value });
    else await clearAccounts({ userIds: selectedUserIds.value, venueAdminIds: selectedVenueAdminIds.value });
    ElMessage.success('操作成功');
    clearConfirmVisible.value = false;
    load();
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败');
  } finally {
    clearSaving.value = false;
  }
}

async function restoreTestAccounts() {
  try {
    const res = await ensureTestAccounts();
    const parts = [];
    if (res.userCreated) parts.push('已创建测试学生（学号 2024001）');
    if (res.venueAdminCreated) parts.push('已创建测试场地管理员（工号 va001）');
    if (parts.length) {
      ElMessage.success(parts.join('；'));
      load();
    } else {
      ElMessage.info('测试账号已存在，无需恢复');
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '恢复失败');
  }
}

function openAddAccount() {
  resetAddForm();
  addAccountVisible.value = true;
}

function resetAddForm() {
  addForm.accountType = 'user';
  addForm.studentIdOrWorkId = '';
  addForm.name = '';
  addForm.password = '';
}

async function submitAddAccount() {
  const id = addForm.studentIdOrWorkId?.trim();
  if (!id) {
    ElMessage.warning(addForm.accountType === 'user' ? '请填写学号' : '请填写工号');
    return;
  }
  addAccountSaving.value = true;
  try {
    if (addForm.accountType === 'user') {
      await createUser({
        studentId: id,
        name: addForm.name?.trim() || undefined,
        password: addForm.password?.trim() || undefined,
      });
      ElMessage.success('学生/老师账号已添加');
    } else {
      await createVenueAdmin({
        workId: id,
        name: addForm.name?.trim() || undefined,
        password: addForm.password?.trim() || undefined,
      });
      ElMessage.success('场地管理员账号已添加');
    }
    addAccountVisible.value = false;
    load();
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '添加失败');
  } finally {
    addAccountSaving.value = false;
  }
}

async function downloadTemplate() {
  try {
    await downloadImportTemplate();
    ElMessage.success('模板已下载');
  } catch (e: any) {
    ElMessage.error(e?.message || '下载失败');
  }
}

async function onImportFile(file: File) {
  if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
    ElMessage.warning('请上传 .xlsx 或 .xls 文件');
    return false;
  }
  importing.value = true;
  try {
    const res = await importAccounts(file);
    const msg = `导入完成：学生 ${res.usersCreated} 人，场地管理员 ${res.venueAdminsCreated} 人${res.errors?.length ? '；' + res.errors.slice(0, 3).join('；') : ''}`;
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

async function load() {
  users.value = (await getUsers()) as unknown as any[];
  venueAdmins.value = (await getVenueAdmins()) as unknown as any[];
  allVenues.value = (await getVenueList({})) as unknown as any[];
}

function openNotify(type: 'user' | 'venue_admin', id: number, _label: string) {
  notifyForm.targetType = type;
  notifyForm.targetId = id;
  notifyForm.title = '';
  notifyForm.content = '';
  notifyVisible.value = true;
}

async function sendNotify() {
  if (!notifyForm.title || !notifyForm.content) {
    ElMessage.warning('请填写标题和内容');
    return;
  }
  notifySaving.value = true;
  try {
    if (notifyForm.targetType === 'user') {
      await notifyUser(notifyForm.targetId, notifyForm.title, notifyForm.content);
    } else {
      await notifyVenueAdmin(notifyForm.targetId, notifyForm.title, notifyForm.content);
    }
    ElMessage.success('已发送');
    notifyVisible.value = false;
  } catch (e: any) {
    ElMessage.error(e?.message || '发送失败');
  } finally {
    notifySaving.value = false;
  }
}

function openScope(row: any) {
  scopeTarget.value = { id: row.id, workId: row.workId, name: row.name };
  scopeVenueIds.value = (row.venues || []).map((v: any) => v.id);
  scopeVisible.value = true;
}

async function saveScope() {
  if (!scopeTarget.value) return;
  scopeSaving.value = true;
  try {
    await updateVenueAdminScope(scopeTarget.value.id, scopeVenueIds.value);
    ElMessage.success('已保存');
    scopeVisible.value = false;
    load();
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败');
  } finally {
    scopeSaving.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.account-manage-page {
  padding: 16px 20px;
  background: transparent;
  min-height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.page-title {
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  flex-shrink: 0;
}
.card-toolbar,
.card-filter {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px 16px;
  margin-bottom: 16px;
  flex-shrink: 0;
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

.table-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 16px;
}
.account-tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.account-tabs :deep(.el-tabs__header) {
  order: 0;
  flex-shrink: 0;
  margin: 0 0 12px 0;
  padding: 0;
  background: #fff;
}
.account-tabs :deep(.el-tabs__nav-wrap) { background: #fff; }
.account-tabs :deep(.el-tabs__item) { color: #606266; }
.account-tabs :deep(.el-tabs__item.is-active) { color: #325ba7; font-weight: 600; }
.account-tabs :deep(.el-tabs__active-bar),
.account-tabs :deep(.el-tabs__ink-bar) { background-color: #325ba7; }
.account-tabs :deep(.el-tabs__content) {
  order: 1;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  background: #fff;
}
.table-wrap :deep(.el-table) { font-size: 13px; }
.table-wrap :deep(.el-table th) { background: #f5f7fa; color: #606266; font-weight: 500; }

.clear-dialog-desc { margin: 0 0 8px; color: var(--el-text-color-regular); }
.clear-scope-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
</style>
