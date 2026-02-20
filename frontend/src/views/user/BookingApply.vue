<template>
  <div class="page">
    <div class="form-wrap">
      <el-card class="booking-card">
      <el-form :model="form" label-width="120px" class="booking-form">
        <el-form-item label="场地">
          <el-select v-model="form.venueId" placeholder="请选择场地" filterable style="width: 100%" @change="onVenueChange">
            <el-option v-for="v in venues" :key="v.id" :label="v.name" :value="v.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="使用日期">
          <el-date-picker
            v-model="form.useDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            style="width: 100%"
            :disabled-date="disabledPastDate"
          />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-time-select
            v-model="form.startTime"
            :start="minStartTime"
            step="00:30"
            end="22:00"
            placeholder="开始时间"
            style="width: 100%"
            @change="onStartTimeChange"
          />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-time-select
            v-model="form.endTime"
            :start="minEndTime"
            step="00:30"
            end="22:00"
            placeholder="结束时间"
            style="width: 100%"
            @change="onEndTimeChange"
          />
        </el-form-item>
        <el-form-item v-if="form.venueId && form.useDate && form.startTime && form.endTime" label="时段状态">
          <el-tag v-if="availability.past" type="info">该时段已过，请选择未开始的时间</el-tag>
          <el-tag v-else-if="availability.available" type="success">该时段可预约</el-tag>
          <el-tag v-else type="danger">该时段已被预约或不可用</el-tag>
        </el-form-item>
        <el-form-item label="活动名称">
          <el-input v-model="form.activityName" placeholder="活动名称" />
        </el-form-item>
        <el-form-item label="主办单位">
          <el-input v-model="form.organizer" placeholder="社团/班级等" />
        </el-form-item>
        <el-form-item label="预计人数">
          <el-input-number v-model="form.estimatedPeople" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="form.contactName" placeholder="活动负责人" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.contactPhone" placeholder="联系电话" />
        </el-form-item>
        <el-form-item label="活动说明">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="活动简要说明" />
        </el-form-item>
        <el-form-item label="策划书">
          <el-upload
            :limit="1"
            :on-change="onFileChange"
            :auto-upload="false"
            accept=".pdf,.doc,.docx"
          >
            <el-button type="primary">选择文件</el-button>
            <template #tip> 可选 PDF/Word，不超过 10MB </template>
          </el-upload>
          <span v-if="form.proposalDocumentPath" class="path">{{ form.proposalDocumentPath }}</span>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="submit">提交申请</el-button>
          <el-button @click="$router.push('/user/venue-list')">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getVenueList } from '@/api/venue';
import { checkAvailability, createBooking } from '@/api/booking';
import { uploadProposal } from '@/api/upload';
import type { Venue } from '@/types';

const route = useRoute();
const router = useRouter();
const venues = ref<Venue[]>([]);
const loading = ref(false);
const availability = ref<{ available: boolean; past?: boolean }>({ available: false });

const form = reactive({
  venueId: 0,
  useDate: '',
  startTime: '',
  endTime: '',
  activityName: '',
  organizer: '',
  estimatedPeople: 0,
  contactName: '',
  contactPhone: '',
  description: '',
  proposalDocumentPath: '',
});

onMounted(async () => {
  const all = await getVenueList({});
  venues.value = Array.isArray(all) ? all.filter((v) => v.isAvailable) : [];
  const q = route.query.venueId;
  if (q) form.venueId = Number(q);
});

watch(
  () => form.useDate,
  () => {
    if (form.useDate === todayStr() && form.startTime && timeToMinutes(form.startTime) < timeToMinutes(nextSlotFromNow())) {
      form.startTime = nextSlotFromNow();
      if (form.endTime && timeToMinutes(form.endTime) <= timeToMinutes(form.startTime)) {
        form.endTime = add30Min(form.startTime);
      }
    }
  }
);

watch(
  () => [form.venueId, form.useDate, form.startTime, form.endTime],
  async () => {
    if (!form.venueId || !form.useDate || !form.startTime || !form.endTime) return;
    try {
      availability.value = await checkAvailability(form.venueId, form.useDate, form.startTime, form.endTime);
    } catch {
      availability.value = { available: false };
    }
  }
);

/** 今天日期 YYYY-MM-DD */
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 将 HH:mm 转为分钟数 */
function timeToMinutes(t: string) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** 下一个 30 分钟整点，格式 HH:mm，不超过 22:00 */
function nextSlotFromNow() {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const next = Math.min(Math.ceil(minutes / 30) * 30, 22 * 60);
  const h = Math.floor(next / 60);
  const m = next % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** 某时间加 30 分钟，返回 HH:mm，不超过 22:00 */
function add30Min(time: string) {
  const minutes = timeToMinutes(time) + 30;
  const total = Math.min(minutes, 22 * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** 开始时间选择器的最小值：选今天则从当前时间之后第一个半点开始 */
const minStartTime = computed(() => {
  if (!form.useDate || form.useDate !== todayStr()) return '08:00';
  return nextSlotFromNow();
});

/** 结束时间选择器的最小值：开始时间之后 30 分钟 */
const minEndTime = computed(() => {
  if (!form.startTime) return '08:00';
  return add30Min(form.startTime);
});

function onStartTimeChange() {
  if (form.startTime && form.endTime && timeToMinutes(form.endTime) <= timeToMinutes(form.startTime)) {
    form.endTime = add30Min(form.startTime);
  }
}

function onEndTimeChange() {
  if (form.startTime && form.endTime && timeToMinutes(form.endTime) <= timeToMinutes(form.startTime)) {
    form.endTime = add30Min(form.startTime);
  }
}

function disabledPastDate(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() < today.getTime();
}

function isSlotInPast(): boolean {
  if (!form.useDate || !form.startTime) return false;
  const slotStart = new Date(`${form.useDate} ${form.startTime}`);
  return slotStart <= new Date();
}

function onVenueChange() {}
function onFileChange(file: any) {
  const f = file.raw;
  if (!f) return;
  uploadProposal(f).then((res) => {
    if (res.path) form.proposalDocumentPath = res.path;
  });
}

async function submit() {
  if (!form.venueId || !form.useDate || !form.startTime || !form.endTime || !form.activityName || !form.organizer || !form.contactName || !form.contactPhone) {
    ElMessage.warning('请填写必填项');
    return;
  }
  if (timeToMinutes(form.startTime) >= timeToMinutes(form.endTime)) {
    ElMessage.warning('开始时间不能晚于或等于结束时间');
    return;
  }
  if (isSlotInPast()) {
    ElMessage.warning('无法预约当前时间之前的场地，请选择未开始的时间段');
    return;
  }
  if (!availability.value.available || availability.value.past) {
    ElMessage.warning('该时段不可预约，请更换时间或场地');
    return;
  }
  loading.value = true;
  try {
    await createBooking({
      ...form,
      proposalDocumentPath: form.proposalDocumentPath || undefined,
    });
    ElMessage.success('提交成功');
    router.push('/user/my-bookings');
  } catch (e: any) {
    ElMessage.error(e?.message || '提交失败');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; align-items: center; }
.form-wrap { width: 100%; display: flex; justify-content: center; }
.booking-card { max-width: 880px; width: 100%; }
.booking-form { text-align: left; }
.booking-form :deep(.el-form-item) { justify-content: flex-start; }
.booking-form :deep(.el-form-item__content) { justify-content: flex-start; }
.path { font-size: 12px; color: #666; margin-left: 8px; }
</style>
