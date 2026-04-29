"use client";
import { createContext, useState, useEffect, ReactNode, useContext } from "react"
import { useRouter } from "next/navigation";

type User = { id: string, role: string, assigned_roles?: string[], email: string, full_name: string, is_verified: boolean };
type AuthContextType = {
    user: User | null,
    loading: boolean,
    profileStatus: string | null,
    login: (email: string, password: string) => Promise<void>,
    googleLogin: (credential?: string) => Promise<void>,
    logout: () => void,
    readWriterProfile: () => void;
};

export const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    profileStatus: null,
    login: async () => { },
    googleLogin: async () => { },
    logout: async () => { },
    readWriterProfile: async () => { },
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [profileStatus, setProfileStatus] = useState<string>("")
    const router = useRouter();

    // Restore session from httpOnly cookie on mount — try refresh if access token is expired
    useEffect(() => {
        fetch('/api/auth/me', { credentials: 'include' })
            .then(async res => {
                if (res.ok) return res.json();
                if (res.status === 401) {
                    // Access token expired — attempt silent refresh
                    const refreshRes = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
                    if (refreshRes.ok) {
                        const meRes = await fetch('/api/auth/me', { credentials: 'include' });
                        if (meRes.ok) return meRes.json();
                    }
                }
                return null;
            })
            .then(data => { if (data?.data) setUser(data.data); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const login = async (email: string, password: string): Promise<void> => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data?.error?.message || 'Login failed');
        }
        setUser(data.data);
    };

    const googleLogin = async () => {
        window.location.href = '/api/auth/google';
    };

    const logout = async () => {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
        setUser(null);
        router.push('/login');
    };

    const readWriterProfile = async () => {
        try {
            if (!user) return null;
            const res = await fetch('/api/writer/read-profile', { credentials: 'include' });
            if (!res.ok) return null;
            const data = await res.json();
            const profile = data?.data;
            if (profile) {
                setProfileStatus(profile.profile_status);
            }
            return profile;
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            googleLogin,
            logout,
            profileStatus,
            readWriterProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
