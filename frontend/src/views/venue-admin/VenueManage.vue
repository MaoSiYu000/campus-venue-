<template>
  <div class="page">
    <h2>场地管理</h2>
    <p class="desc">维护与更新场地基本信息与照片，学生将在场地列表中看到照片与信息。</p>
    <el-table :data="list" v-loading="loading" border>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="name" label="名称" width="140" />
      <el-table-column prop="venueType" label="类型" width="100">
        <template #default="{ row }">{{ venueTypeName(row.venueType) }}</template>
      </el-table-column>
      <el-table-column prop="capacity" label="容量" width="80" />
      <el-table-column prop="location" label="位置" />
      <el-table-column label="照片" width="80">
        <template #default="{ row }">
          <span v-if="row.photos?.length">{{ row.photos.length }} 张</span>
          <span v-else class="text-muted">无</span>
        </template>
      </el-table-column>
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
    <el-dialog v-model="editVisible" title="编辑场地" width="560px" @close="editForm = null">
      <el-form v-if="editForm" :model="editForm" label-width="100px">
        <el-form-item label="名称"><el-input v-model="editForm.name" /></el-form-item>
        <el-form-item label="位置"><el-input v-model="editForm.location" placeholder="楼栋/区域" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="editForm.address" placeholder="详细地址" /></el-form-item>
        <el-form-item label="容量"><el-input-number v-model="editForm.capacity" :min="0" style="width: 100%" /></el-form-item>
        <el-form-item label="开放时间">
          <el-time-picker v-model="editForm.openTimeVal" value-format="HH:mm" format="HH:mm" placeholder="开始" style="width: 48%" />
          —
          <el-time-picker v-model="editForm.closeTimeVal" value-format="HH:mm" format="HH:mm" placeholder="结束" style="width: 48%" />
        </el-form-item>
        <el-form-item label="设备">
          <el-checkbox v-model="editForm.hasProjector">投影</el-checkbox>
          <el-checkbox v-model="editForm.hasSound">音响</el-checkbox>
        </el-form-item>
        <el-form-item label="可用">
          <el-switch v-model="editForm.isAvailable" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="场地照片">
          <div class="photo-list">
            <div v-for="(url, i) in editForm.photos" :key="url" class="photo-item">
              <img :src="photoUrl(url)" alt="" />
              <el-button type="danger" link size="small" class="photo-remove" @click="removePhoto(i)">删除</el-button>
            </div>
            <el-upload
              :show-file-list="false"
              accept="image/*"
              :before-upload="beforePhotoUpload"
            >
              <el-button type="primary" plain size="small">上传图片</el-button>
            </el-upload>
          </div>
          <div class="hint">支持 JPG/PNG 等，单张不超过 5MB，学生将在场地列表中看到。</div>
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
import { uploadVenuePhoto } from '@/api/upload';
import type { Venue } from '@/types';

const list = ref<Venue[]>([]);
const loading = ref(false);
const editVisible = ref(false);
const editForm = ref<{
  id: number;
  name: string;
  location: string | null;
  address: string | null;
  capacity: number;
  openTimeVal: string | null;
  closeTimeVal: string | null;
  hasProjector: boolean;
  hasSound: boolean;
  isAvailable: number;
  photos: string[];
} | null>(null);
const saving = ref(false);
const slotVisible = ref(false);
const slotForm = reactive({ venueId: 0, startTime: '', endTime: '', reason: '' });
const slotSaving = ref(false);

function photoUrl(path: string) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return path.startsWith('/') ? path : `/${path}`;
}

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
  editForm.value = {
    id: row.id,
    name: row.name,
    location: row.location ?? '',
    address: row.address ?? '',
    capacity: row.capacity ?? 0,
    openTimeVal: row.openTime ?? null,
    closeTimeVal: row.closeTime ?? null,
    hasProjector: !!(row.hasProjector ?? 0),
    hasSound: !!(row.hasSound ?? 0),
    isAvailable: row.isAvailable ?? 1,
    photos: Array.isArray(row.photos) ? [...row.photos] : [],
  };
  editVisible.value = true;
}

function removePhoto(index: number) {
  if (editForm.value) editForm.value.photos.splice(index, 1);
}

const PHOTO_MAX_SIZE = 15 * 1024 * 1024;

function beforePhotoUpload(file: File) {
  if (file.size > PHOTO_MAX_SIZE) {
    ElMessage.warning('图片不能超过 15MB，请压缩后上传');
    return false;
  }
  onPhotoUpload(file);
  return false;
}

async function onPhotoUpload(file: File) {
  if (!editForm.value) return;
  try {
    const res = await uploadVenuePhoto(file);
    if (res.path) {
      editForm.value.photos.push(res.path);
      ElMessage.success('已添加图片');
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '上传失败');
  }
}

async function saveEdit() {
  if (!editForm.value) return;
  saving.value = true;
  try {
    await updateVenue(editForm.value.id, {
      name: editForm.value.name,
      location: editForm.value.location || undefined,
      address: editForm.value.address || undefined,
      capacity: editForm.value.capacity,
      openTime: editForm.value.openTimeVal || undefined,
      closeTime: editForm.value.closeTimeVal || undefined,
      hasProjector: editForm.value.hasProjector ? 1 : 0,
      hasSound: editForm.value.hasSound ? 1 : 0,
      isAvailable: editForm.value.isAvailable,
      photos: editForm.value.photos,
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

<style scoped>
.desc { color: #666; font-size: 13px; margin-bottom: 16px; }
.text-muted { color: #999; }
.photo-list { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-start; }
.photo-item { position: relative; width: 80px; }
.photo-item img { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; display: block; }
.photo-remove { position: absolute; bottom: 0; left: 0; right: 0; }
.hint { font-size: 12px; color: #999; margin-top: 8px; }
</style>
