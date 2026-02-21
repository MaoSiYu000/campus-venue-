import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { LoginUser, RoleType } from '@/types';

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem('accessToken'));
  const user = ref<LoginUser | null>(null);

  const saved = localStorage.getItem('user');
  if (saved) {
    try {
      user.value = JSON.parse(saved);
    } catch (_) {}
  }

  const isLoggedIn = computed(() => !!token.value);
  const role = computed<RoleType | null>(() => user.value?.role ?? null);
  const mustChangePassword = computed(() => user.value?.mustChangePassword === true);
  const announcementsConfirmedRef = ref(
    typeof sessionStorage !== 'undefined' && sessionStorage.getItem('announcementsConfirmed') === '1',
  );
  const announcementsConfirmed = computed(() => {
    const r = user.value?.role;
    if (r !== 'user' && r !== 'venue_admin') return true;
    return announcementsConfirmedRef.value;
  });

  function setAnnouncementsConfirmed() {
    sessionStorage.setItem('announcementsConfirmed', '1');
    announcementsConfirmedRef.value = true;
  }

  function setLogin(data: LoginUser | Record<string, unknown>) {
    const accessToken = (data as any).accessToken ?? (data as any).access_token;
    if (!accessToken) return;
    const loginData: LoginUser = {
      accessToken,
      role: (data as any).role,
      id: (data as any).id,
      studentId: (data as any).studentId,
      workId: (data as any).workId,
      username: (data as any).username,
      name: (data as any).name,
      phone: (data as any).phone,
      college: (data as any).college,
      major: (data as any).major,
      class: (data as any).class,
      avatar: (data as any).avatar,
      mustChangePassword: (data as any).mustChangePassword,
    };
    token.value = accessToken;
    user.value = loginData;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(loginData));
    if (loginData.role === 'user' || loginData.role === 'venue_admin') {
      sessionStorage.removeItem('announcementsConfirmed');
      announcementsConfirmedRef.value = false;
    }
  }

  function setProfile(partial: Partial<Pick<LoginUser, 'name' | 'phone' | 'college' | 'major' | 'class' | 'avatar'>>) {
    if (!user.value) return;
    if (partial.name !== undefined) user.value.name = partial.name;
    if (partial.phone !== undefined) user.value.phone = partial.phone;
    if (partial.college !== undefined) user.value.college = partial.college;
    if (partial.major !== undefined) user.value.major = partial.major;
    if (partial.class !== undefined) user.value.class = partial.class;
    if (partial.avatar !== undefined) user.value.avatar = partial.avatar;
    localStorage.setItem('user', JSON.stringify(user.value));
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('announcementsConfirmed');
  }

  return { token, user, isLoggedIn, role, mustChangePassword, announcementsConfirmed, setAnnouncementsConfirmed, setLogin, setProfile, logout };
});
