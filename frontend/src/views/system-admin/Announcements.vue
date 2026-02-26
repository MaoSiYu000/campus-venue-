<template>
  <div class="page">
    <div class="announcements-wrapper">
      <div class="announcements-flip" :class="{ flipped: showHistory }">
        <div class="announcements-face publish-face">
          <h2 class="panel-title">发布公告</h2>
          <div class="panel-body publish-body">
            <el-form :model="form" label-width="150px">
              <el-form-item label="标题">
                <el-input v-model="form.title" placeholder="公告标题" />
              </el-form-item>
              <el-form-item label="内容">
                <el-input v-model="form.content" type="textarea" :rows="8" placeholder="公告内容" />
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
            <div class="corner-tab" title="查看历史公告" @click.stop="showHistory = true">
              <span class="corner-tab-text">历史</span>
            </div>
          </div>
        </div>
        <div class="announcements-face history-face" :class="{ 'no-pointer': !showHistory }">
          <h2 class="panel-title">历史公告</h2>
          <div class="panel-body history-body">
            <div class="history-table-wrap">
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
            </div>
            <div class="corner-tab history-corner" title="返回发布公告" @click.stop="showHistory = false">
              <span class="corner-tab-text">发布</span>
            </div>
          </div>
        </div>
      </div>
    </div>
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
const showHistory = ref(false);

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
.announcements-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
  perspective: 1200px;
  margin-top: 70px;
}
.announcements-flip {
  width: 891px;
  max-width: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 1.2s ease;
  transform: scale(0.9);
  transform-origin: top center;
}
.announcements-flip.flipped {
  transform: scale(0.9) rotateY(180deg);
}
.announcements-face {
  width: 100%;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  backface-visibility: hidden;
}
.announcements-face.no-pointer {
  pointer-events: none;
}
.history-face {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  transform: rotateY(180deg);
  display: flex;
  flex-direction: column;
}
.publish-face {
  display: flex;
  flex-direction: column;
}
.panel-title {
  margin: 0;
  padding: 19px 36px;
  background: #325ba7;
  color: #fff;
  font-size: 27px;
  font-weight: 600;
  text-align: center;
  border-radius: 8px 8px 0 0;
  flex-shrink: 0;
}
.panel-body {
  padding: 25px 30px 84px 30px;
  position: relative;
  flex: 1;
  min-height: 294px;
  display: flex;
  flex-direction: column;
}
.publish-body {
  padding-top: 50px;
}
.publish-body :deep(.el-form-item) {
  margin-bottom: 17px;
}
.publish-body :deep(.el-form-item__label) {
  font-size: 21px;
}
.publish-body :deep(.el-input__inner),
.publish-body :deep(.el-textarea__inner) {
  font-size: 21px;
}
.publish-body :deep(.el-input__inner::placeholder),
.publish-body :deep(.el-textarea__inner::placeholder) {
  font-size: 21px;
}
.publish-body :deep(.el-form) {
  flex: 1;
}
.history-body {
  padding: 25px 30px 84px 30px;
}
.history-table-wrap {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
.corner-tab {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 120px;
  height: 120px;
  background: #325ba7;
  clip-path: polygon(100% 0, 100% 100%, 0 100%);
  cursor: pointer;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 0 14px 14px 0;
  z-index: 20;
  transition: opacity 0.2s;
  filter: drop-shadow(3px 3px 8px rgba(0, 0, 0, 0.35));
}
.corner-tab:hover {
  opacity: 0.9;
}
.corner-tab-text {
  color: #fff;
  font-size: 22px;
  font-weight: 500;
  pointer-events: none;
}
.history-corner {
  background: #325ba7;
}
.date-time-cell { line-height: 1.4; }
.date-line { font-size: 13px; color: #303133; }
.time-line { font-size: 12px; color: #909399; }
.detail-row { margin-bottom: 12px; }
.detail-row .detail-label { display: inline-block; width: 80px; color: #909399; margin-right: 8px; vertical-align: top; }
.detail-row.content-row .detail-label { margin-top: 2px; }
.detail-content { display: inline-block; max-width: 380px; white-space: pre-wrap; word-break: break-word; }
</style>
