<template>
  <div class="login-page">
    <header class="login-header">
      <span class="login-header-text">浙江工业大学 | 校园场地预约系统</span>
    </header>

    <main class="login-body">
      <div
        class="login-bg-carousel"
        @touchstart="onTouchStart"
        @touchend="onTouchEnd"
        @mousedown="onMouseDown"
        @mouseup="onMouseUp"
      >
        <div class="carousel-fallback" />
        <div
          v-for="(src, i) in bgImages"
          :key="i"
          class="carousel-slide"
          :class="{ active: currentSlide === i, 'img-failed': imgFailed[i] }"
        >
          <img :src="src" alt="" decoding="async" @error="onImgError(i)" />
        </div>
      </div>

      <div class="login-card-wrap">
        <div class="login-card-outer">
          <div class="login-card">
          <h1>校园场地预约系统</h1>
          <el-form :model="form" label-width="80px" @submit.prevent="onSubmit">
            <el-form-item label="身份">
              <el-select v-model="form.role" placeholder="请选择" style="width: 100%">
                <el-option label="学生/老师" value="user" />
                <el-option label="场地管理员" value="venue_admin" />
                <el-option label="系统管理员" value="system_admin" />
              </el-select>
            </el-form-item>
            <el-form-item :label="accountLabel">
              <el-input v-model="form.account" :placeholder="accountPlaceholder" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="loading" style="width: 100%" @click="onSubmit">登录</el-button>
            </el-form-item>
          </el-form>
          </div>
        </div>
      </div>
    </main>

    <footer class="login-footer" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';
import { login } from '@/api/auth';

const router = useRouter();
const store = useUserStore();
const loading = ref(false);
const form = ref({
  role: 'user' as 'user' | 'venue_admin' | 'system_admin',
  account: '',
  password: '',
});

const accountLabel = computed(() => {
  if (form.value.role === 'user') return '学号';
  if (form.value.role === 'venue_admin') return '工号';
  return '用户名';
});

const accountPlaceholder = computed(() => {
  if (form.value.role === 'user') return '请输入学号';
  if (form.value.role === 'venue_admin') return '请输入工号';
  return '请输入用户名';
});

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const bgImages = ref<string[]>([
  `${base}/images/1.png`,
  `${base}/images/2.png`,
  `${base}/images/3.png`,
  `${base}/images/4.jpg`,
  `${base}/images/5.jpg`,
]);
const currentSlide = ref(0);
const imgFailed = ref<Record<number, boolean>>({});
let timer: ReturnType<typeof setInterval> | null = null;
const TOUCH_THRESHOLD = 50;
let touchStartX = 0;
let touchEndX = 0;
let mouseStartX = 0;
let mouseEndX = 0;

function onImgError(index: number) {
  imgFailed.value = { ...imgFailed.value, [index]: true };
}

function goSlide(next: number) {
  const len = bgImages.value.length;
  if (len === 0) return;
  currentSlide.value = (next % len + len) % len;
}

function startAutoPlay() {
  stopAutoPlay();
  timer = setInterval(() => {
    goSlide(currentSlide.value + 1);
  }, 15000);
}

function stopAutoPlay() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX;
}

function onTouchEnd(e: TouchEvent) {
  touchEndX = e.changedTouches[0].clientX;
  const delta = touchStartX - touchEndX;
  if (Math.abs(delta) > TOUCH_THRESHOLD) {
    if (delta > 0) goSlide(currentSlide.value + 1);
    else goSlide(currentSlide.value - 1);
  }
}

function onMouseDown(e: MouseEvent) {
  mouseStartX = e.clientX;
}

function onMouseUp(e: MouseEvent) {
  mouseEndX = e.clientX;
  const delta = mouseStartX - mouseEndX;
  if (Math.abs(delta) > TOUCH_THRESHOLD) {
    if (delta > 0) goSlide(currentSlide.value + 1);
    else goSlide(currentSlide.value - 1);
  }
}

onMounted(() => {
  startAutoPlay();
});

onUnmounted(() => {
  stopAutoPlay();
});

async function onSubmit() {
  if (!form.value.account || !form.value.password) {
    ElMessage.warning('请填写完整');
    return;
  }
  loading.value = true;
  try {
    const data = await login(form.value.role, form.value.account, form.value.password);
    const payload = (data as any)?.data ?? data;
    store.setLogin(payload);
    const role = payload?.role ?? (data as any)?.role;
    if (role === 'user') {
      if (payload?.mustChangePassword) router.replace('/user/change-password?first=1');
      else router.replace('/user/announcements');
    } else if (role === 'venue_admin') {
      router.replace('/venue-admin/announcements');
    } else {
      router.replace('/system-admin/overview');
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '登录失败');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: url('/images/背景2.jpg') center center / cover no-repeat;
}

.login-header {
  height: calc(100vh / 16 * 1.5);
  min-height: 72px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: clamp(20px, 5vw, 56px);
  background: #325ba7;
  color: #fff;
}

.login-header-text {
  font-size: clamp(14px, 2.2vw, 22px);
  font-weight: 600;
  letter-spacing: 0.02em;
}

.login-body {
  flex: 1;
  position: relative;
  min-height: 0;
}

.login-bg-carousel {
  position: absolute;
  inset: 0;
  overflow: hidden;
  user-select: none;
  cursor: grab;
}
.login-bg-carousel:active {
  cursor: grabbing;
}

.carousel-slide {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.8s ease;
  z-index: 0;
}

.carousel-slide.active {
  opacity: 1;
  z-index: 1;
}

.carousel-slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.carousel-slide.img-failed {
  background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #1e3a5f 100%);
}
.carousel-slide.img-failed img {
  opacity: 0;
  pointer-events: none;
}

.carousel-fallback {
  position: absolute;
  inset: 0;
  background: url('/images/背景2.jpg') center center / cover no-repeat;
  z-index: 0;
}

.login-card-wrap {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: clamp(24px, 14vw, 200px);
  z-index: 1;
}

.login-card-outer {
  padding: calc(380px / 32);
  background: rgba(255, 255, 255, 0.35);
}

.login-card {
  width: 380px;
  aspect-ratio: 12 / 9;
  max-width: calc(100vw - 48px);
  padding: 14px 20px;
  background: #fff;
  border-radius: 0;
  border: 3px solid rgba(255, 255, 255, 0.85);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 12px 40px rgba(0, 0, 0, 0.12),
    0 24px 80px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.login-card h1 {
  text-align: center;
  margin-bottom: 14px;
  font-size: 20px;
  color: #1e3a5f;
}

.login-card .el-form {
  width: 100%;
  max-width: 320px;
  transform: translateX(-10px);
}

.login-card .el-form-item {
  margin-bottom: 12px;
}
.login-card .el-form-item:last-child {
  margin-bottom: 0;
}

.login-footer {
  height: calc(100vh / 32);
  min-height: 24px;
  flex-shrink: 0;
  background: #325ba7;
}
</style>
