"use client";
import { createContext, useState, useEffect, ReactNode, useContext } from "react"
import { storage } from "@/app/lib/storage"
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";

type User = { id: string, role: string, assigned_roles?: string[], email: string, full_name: string, is_verified: boolean };
type AuthContextType = {
    user: User | null,
    accessToken: string | null,
    loading: boolean,
    profileStatus: string | null,
    login: (email: string, password: string) => Promise<void>,
    googleLogin: (credential?: string) => Promise<void>, // Fix: likely needs credential for Google
    logout: () => void,
    readWriterProfile: () => void;
};

interface DecodedToken {
    id: string;
    role: string;
    email: string;
    full_name: string;
    is_verified: boolean;
}

export const AuthContext = createContext<AuthContextType>({
    user: null,
    accessToken: null,
    loading: false,
    profileStatus: null,
    login: async () => { },
    googleLogin: async () => { },
    logout: async () => { },
    readWriterProfile: async () => { },
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    // const [isAdmin, setIsAdmin] = useState<boolean>(false)
    const [isHydrated, setIsHydrated] = useState(false); // Add hydration flag
    // const [res, setRes] = useState() as any
    const [profileStatus, setProfileStatus] = useState<string>("")
    const router = useRouter();

    // Hydration fix: run init only after mount
    useEffect(() => {
        const init = async () => {
            try {
                const currentUser = storage.getCurrentUser();
                if (currentUser) {
                    setAccessToken(currentUser.token);
                    setUser(currentUser.user);
                }
            } catch (err) {
                console.log("No valid session");
                setUser(null);
                setAccessToken(null);
            } finally {
                setIsHydrated(true);
            }
        };
        init();
    }, []);

    // const login = async (email: string, password: string) => {
    //     try {
    //         const res = await api.login(email, password);
    //         const { accessToken } = res.data;
    //         console.log("res.data", res.data)
    //         // Store tokens
    //         localStorage.setItem("accessToken", accessToken);
    //         setAccessToken(accessToken); // Standardize
    //         const decoded: DecodedToken = jwtDecode(accessToken);
    //         setUser({ id: decoded.id, role: decoded.role, email: decoded.email, full_name: decoded.full_name, is_verified: decoded.is_verified });
    //         // router.push('/dashboard'); // Add redirect
    //     } catch (error: any) {
    //         console.error("Login failed:", error);
    //         alert(error.response?.data?.message || "Login failed. Try again.");
    //     }
    // };

    const login = async (email: string, password: string): Promise<void> => {
        try {
            const response = await storage.login(email, password);
            setAccessToken(response.token);
            setUser(response.user);
        } catch (error: any) {
            console.error("Login failed:", error);
            throw error;
        }
    };

    const googleLogin = async () => {
        console.log("Google login not available in standalone mode");
        throw new Error("Google login not available in standalone mode");
    };

    const logout = async () => {
        storage.logout();
        setUser(null);
        setAccessToken(null);
        router.push('/login');
    };

    const readWriterProfile = async () => {
        try {
            if (!user) return null;
            const profile = await storage.getProfile('writer', user.id);
            if (profile) {
                setProfileStatus(profile.profile_status);
            }
            return profile;
        } catch (error) {
            console.log(error);
        }
    }
    // Prevent mismatch: show loading until hydrated
    if (!isHydrated) {
        return (
            <div className="bg-black/40 h-screen backdrop-blur-sm flex items-center justify-between">
                <Loader className="animate" />
            </div>
        );
    }

    // const isAdmin = user?.role === "admin";

    return (
        <AuthContext.Provider value={{
            user,
            accessToken,
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
