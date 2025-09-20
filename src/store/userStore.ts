// src/store/userStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type User = {
    user_id?: number;
    u_id?: string;
    created_at?: string;
    updated_at?: string;
    created_by?: string;
    updated_by?: string;
};

type Profile = {
    user_id?: number;
    display_name?: string;
    gender?: number;
    age?: number;
    residence?: string;
    occupation?: string;
    message?: string;
    created_at?: string;
    updated_at?: string;
    created_by?: string;
    updated_by?: string;
    is_profile_completed?: number;
};

type UserStore = {
    user: User | null;
    profile: Profile | null;
    setUser: (user: User) => void;
    setProfile: (profile: Profile) => void;
    resetUser: () => void;
};

export const useUserStore = create<UserStore>()(
    persist(
        (set) => ({
        user: null,
        profile: null,
        setUser: (user) => set({ user: { ...user } }),
        setProfile: (profile) => set({ profile }),
        resetUser: () => set({ user: null, profile: null }),
        }),
        {
        name: 'user-store',
        }
    )
);