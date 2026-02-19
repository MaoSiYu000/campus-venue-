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
      <el-table-column prop="createdAt" label="发布时间" width="180" />
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
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button link type="danger" @click="deleteWithConfirm(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
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
const deleteConfirmVisible = ref(false);
const deleteTarget = ref<{ id: number; title: string } | null>(null);
const deleteLoading = ref(false);

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
