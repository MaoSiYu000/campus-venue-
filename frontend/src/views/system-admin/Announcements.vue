<template>
  <div class="page">
    <h2>发布公告</h2>
    <el-card style="max-width: 640px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="公告标题" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="form.content" type="textarea" :rows="5" placeholder="公告内容" />
        </el-form-item>
        <el-form-item label="登录必读">
          <el-switch v-model="form.isMustRead" />
        </el-form-item>
        <el-form-item v-if="form.isMustRead" label="目标角色">
          <el-radio-group v-model="form.targetRole">
            <el-radio value="user">学生/老师</el-radio>
            <el-radio value="venue_admin">场地管理员</el-radio>
            <el-radio value="all">全部</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="submit">发布</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <h3 style="margin-top: 24px">历史公告</h3>
    <el-table :data="list" border>
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="createdAt" label="发布时间" width="120">
        <template #default="{ row }">
          <div class="date-time-cell">
            <div class="date-line">{{ formatDate(row.createdAt) }}</div>
            <div class="time-line">{{ formatTime(row.createdAt) }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="isMustRead" label="必读" width="80">
        <template #default="{ row }">{{ row.isMustRead ? '是' : '否' }}</template>
      </el-table-column>
      <el-table-column prop="targetRole" label="目标角色" width="120">
        <template #default="{ row }">
          <span v-if="row.isMustRead">
            {{ row.targetRole === 'user' ? '学生/老师' : row.targetRole === 'venue_admin' ? '场地管理员' : row.targetRole === 'all' ? '全部' : '-' }}
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140">
        <template #default="{ row }">
          <el-button link type="primary" @click="showDetail(row)">详情</el-button>
          <el-button link type="danger" @click="deleteWithConfirm(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="detailVisible" title="公告详情" width="520px">
      <template v-if="detailTarget">
        <div class="detail-row"><span class="detail-label">标题</span>{{ detailTarget.title }}</div>
        <div class="detail-row">
          <span class="detail-label">发布时间</span>
          <div class="date-time-cell">
            <div class="date-line">{{ formatDate(detailTarget.createdAt) }}</div>
            <div class="time-line">{{ formatTime(detailTarget.createdAt) }}</div>
          </div>
        </div>
        <div class="detail-row"><span class="detail-label">必读</span>{{ detailTarget.isMustRead ? '是' : '否' }}</div>
        <div v-if="detailTarget.isMustRead" class="detail-row">
          <span class="detail-label">目标角色</span>
          {{ detailTarget.targetRole === 'user' ? '学生/老师' : detailTarget.targetRole === 'venue_admin' ? '场地管理员' : detailTarget.targetRole === 'all' ? '全部' : '-' }}
        </div>
        <div class="detail-row content-row"><span class="detail-label">内容</span><div class="detail-content">{{ detailTarget.content || '-' }}</div></div>
      </template>
    </el-dialog>
    <el-dialog v-model="deleteConfirmVisible" title="确认删除" width="400px">
      <p>确定要删除公告「{{ deleteTarget?.title }}」吗？此操作不可恢复。</p>
      <template #footer>
        <el-button @click="deleteConfirmVisible = false">取消</el-button>
        <el-button type="danger" :loading="deleteLoading" @click="doDelete">确认删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { createAnnouncement, getAnnouncementList, deleteAnnouncement } from '@/api/announcement';

const form = reactive({ title: '', content: '', isMustRead: false, targetRole: 'all' as 'user' | 'venue_admin' | 'all' });
const loading = ref(false);
const list = ref<any[]>([]);
const detailVisible = ref(false);
const detailTarget = ref<any | null>(null);
const deleteConfirmVisible = ref(false);
const deleteTarget = ref<{ id: number; title: string } | null>(null);
const deleteLoading = ref(false);

function formatDate(s: string | undefined): string {
  if (!s) return '-';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '-';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatTime(s: string | undefined): string {
  if (!s) return '-';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '-';
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const sec = String(d.getSeconds()).padStart(2, '0');
  return `${h}:${min}:${sec}`;
}

function showDetail(row: any) {
  detailTarget.value = row;
  detailVisible.value = true;
}

async function submit() {
  if (!form.title || !form.content) {
    ElMessage.warning('请填写标题和内容');
    return;
  }
  loading.value = true;
  try {
    await createAnnouncement(form);
    ElMessage.success('发布成功');
    form.title = '';
    form.content = '';
    form.isMustRead = false;
    form.targetRole = 'all';
    load();
  } catch (e: any) {
    ElMessage.error(e?.message || '发布失败');
  } finally {
    loading.value = false;
  }
}

function deleteWithConfirm(row: any) {
  deleteTarget.value = { id: row.id, title: row.title };
  deleteConfirmVisible.value = true;
}

async function doDelete() {
  if (!deleteTarget.value) return;
  deleteLoading.value = true;
  try {
    await deleteAnnouncement(deleteTarget.value.id);
    ElMessage.success('删除成功');
    deleteConfirmVisible.value = false;
    load();
  } catch (e: any) {
    ElMessage.error(e?.message || '删除失败');
  } finally {
    deleteLoading.value = false;
  }
}

async function load() {
  list.value = (await getAnnouncementList()) as unknown as any[];
}

onMounted(load);
</script>

<style scoped>
.date-time-cell { line-height: 1.4; }
.date-line { font-size: 13px; color: #303133; }
.time-line { font-size: 12px; color: #909399; }
.detail-row { margin-bottom: 12px; }
.detail-row .detail-label { display: inline-block; width: 80px; color: #909399; margin-right: 8px; vertical-align: top; }
.detail-row.content-row .detail-label { margin-top: 2px; }
.detail-content { display: inline-block; max-width: 380px; white-space: pre-wrap; word-break: break-word; }
</style>
