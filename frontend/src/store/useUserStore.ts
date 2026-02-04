import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UserInfo {
  id: number;
  username: string;
  nickname: string;
  email?: string;
  role: string; // 'super_admin' | 'admin' | 'user' | 'auditor'
  avatar?: string;
  is_superuser?: boolean;
}

interface UserState {
  token: string | null;
  userInfo: UserInfo | null;
  permissions: string[]; // 可扩展：存储具体权限点
  
  setToken: (token: string) => void;
  setUserInfo: (info: UserInfo) => void;
  clearUser: () => void;
  hasRole: (roles: string[]) => boolean;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      token: null,
      userInfo: null,
      permissions: [],

      setToken: (token) => set({ token }),
      
      setUserInfo: (userInfo) => {
        // 简单映射角色到权限列表，实际可由后端返回
        const perms = [];
        if (userInfo.is_superuser || userInfo.role === 'super_admin') {
            perms.push('all');
        } else {
            perms.push(userInfo.role);
        }
        set({ userInfo, permissions: perms });
      },

      clearUser: () => set({ token: null, userInfo: null, permissions: [] }),

      hasRole: (allowedRoles) => {
        const { userInfo } = get();
        if (!userInfo) return false;
        // 如果 role 缺失，默认视为普通用户，避免崩溃
        const currentRole = userInfo.role || 'user'; 
        if (userInfo.is_superuser || currentRole === 'super_admin') return true;
        return allowedRoles.includes(currentRole);
      }
    }),
    {
      name: 'music-admin-storage', // localstorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);
