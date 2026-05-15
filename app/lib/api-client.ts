import { KalamUnderDraft } from "../user/writer/dashboard/page";
import { VocalistProfileType } from "../types/vocalist.types";
import { WriterFormData } from "../types/writer.types";
import { ProducerProfileType } from "../types/producer.types";
import { LiteraryProfileType } from "../types/literary.types";
import { StudioProfileType } from "../types/studio.types";
import { ENV } from "../config/env";

const API_URL = ENV.API_URL;

let accessToken: string | null = null;

const getToken = () => {
    if (!accessToken && typeof window !== "undefined") {
        accessToken = localStorage.getItem("accessToken") || null;
    }
    return accessToken;
};

export const setAccessToken = (token: string) => {
    accessToken = token;
    if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", token);
    }
};

const apiFetch = async (url: string, options: RequestInit = {}) => {
    const token = getToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers,
    });

    if (response.status === 401 && !(options.headers as Record<string, string>)?.['X-Retry']) {
        try {
            const refreshResponse = await fetch(`${API_URL}/auth/refresh-token`, {
                method: 'POST',
                credentials: 'include',
            });

            if (refreshResponse.ok) {
                const data = await refreshResponse.json();
                accessToken = data.accessToken;
                if (accessToken) {
                    localStorage.setItem("accessToken", accessToken);
                }

                return apiFetch(url, {
                    ...options,
                    headers: { ...options.headers, 'X-Retry': 'true' }
                });
            }
        } catch (refreshErr) {
            console.error("Refresh token expired", refreshErr);
            localStorage.removeItem("accessToken");
            if (typeof window !== "undefined" && window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
            throw refreshErr;
        }
    }

    return response;
};

export const register = (full_name: string, email: string, password: string) => {
    return apiFetch(`${API_URL}/auth/register`, {
        method: 'POST',
        body: JSON.stringify({ full_name, email, password })
    });
};

export const login = (email: string, password: string) => {
    return apiFetch(`${API_URL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
};

export const googleLogin = () => {
    return apiFetch(`${API_URL}/auth/google`);
};

export const verifyEmail = (email: string, otp: string) => {
    return apiFetch(`${API_URL}/auth/verify-email`, {
        method: 'POST',
        body: JSON.stringify({ email, otp })
    });
};

export const resetPasswordSendOtp = (email: string) => {
    return apiFetch(`${API_URL}/auth/reset-password-send-otp`, {
        method: 'POST',
        body: JSON.stringify({ email })
    });
};

export const resetPasswordVerifyOtp = (email: string, otp: string) => {
    return apiFetch(`${API_URL}/auth/reset-password-verify-otp`, {
        method: 'POST',
        body: JSON.stringify({ email, otp })
    });
};

export const resetPasswordViaOtp = (email: string, password: string, tempToken: string) => {
    return apiFetch(`${API_URL}/auth/reset-password-via-otp`, {
        method: 'POST',
        body: JSON.stringify({ email, password, tempToken })
    });
};

export const logout = () => {
    return apiFetch(`${API_URL}/auth/logout`, { method: 'POST' });
};

export const refreshToken = () => {
    return apiFetch(`${API_URL}/auth/refresh-token`, { method: 'POST' });
};

export const updatePassword = (currentPassword: string, newPassword: string) => {
    return apiFetch(`${API_URL}/auth/update-password`, {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
    });
};

export const createWriterProfile = (form: WriterFormData) => {
    return apiFetch(`${API_URL}/writer/create-profile`, {
        method: 'POST',
        body: JSON.stringify(form)
    });
};

export const readWriterProfile = () => {
    return apiFetch(`${API_URL}/writer/read-profile`);
};

export const updateWriterProfile = (form: WriterFormData) => {
    return apiFetch(`${API_URL}/writer/update-profile`, {
        method: 'POST',
        body: JSON.stringify(form)
    });
};

export const updateWriterStatus = (id: string, status: string) => {
    return apiFetch(`${API_URL}/writer/update-status/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
    });
};

export const deleteWriterProfile = () => {
    return apiFetch(`${API_URL}/writer/delete-profile`, { method: 'DELETE' });
};

export const getAllWriter = () => {
    return apiFetch(`${API_URL}/writer/get-all`);
};

export const createKalam = (kalam: KalamUnderDraft) => {
    return apiFetch(`${API_URL}/kalam/create`, {
        method: 'POST',
        body: JSON.stringify(kalam)
    });
};

export const getUserAllKalams = () => {
    return apiFetch(`${API_URL}/kalam/get-all-user`);
};

export const getAllKalams = () => {
    return apiFetch(`${API_URL}/kalam/get-all`);
};

export const updateKalam = (id: string, data: any) => {
    return apiFetch(`${API_URL}/kalam/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
};

export const deleteKalam = (id: string) => {
    return apiFetch(`${API_URL}/kalam/${id}`, { method: 'DELETE' });
};

export const updateKalamStatus = (id: string, status: string, revision_notes: string | null) => {
    return apiFetch(`${API_URL}/kalam/update-status/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, revision_notes })
    });
};

export const createVocalistProfile = (form: VocalistProfileType) => {
    return apiFetch(`${API_URL}/vocalist/create`, {
        method: 'POST',
        body: JSON.stringify(form)
    });
};

export const readVocalistProfile = () => {
    return apiFetch(`${API_URL}/vocalist/read`);
};

export const updateVocalistProfile = (form: VocalistProfileType) => {
    return apiFetch(`${API_URL}/vocalist/update`, {
        method: 'PATCH',
        body: JSON.stringify(form)
    });
};

export const updateVocalistStatus = (id: string, status: string) => {
    return apiFetch(`${API_URL}/vocalist/update-status/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
    });
};

export const deleteVocalistProfile = () => {
    return apiFetch(`${API_URL}/vocalist/delete`, { method: 'DELETE' });
};

export const getAllVocalists = () => {
    return apiFetch(`${API_URL}/vocalist/all`);
};

export const createSada = (sada: any) => {
    return apiFetch(`${API_URL}/sada/create`, {
        method: 'POST',
        body: JSON.stringify(sada)
    });
};

export const getUserAllSadas = () => {
    return apiFetch(`${API_URL}/sada/get-all-user`);
};

export const getAllSadas = () => {
    return apiFetch(`${API_URL}/sada/get-all`);
};

export const updateSada = (id: string, data: any) => {
    return apiFetch(`${API_URL}/sada/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
};

export const deleteSada = (id: string) => {
    return apiFetch(`${API_URL}/sada/${id}`, { method: 'DELETE' });
};

export const updateSadaStatus = (id: string, data: any) => {
    return apiFetch(`${API_URL}/sada/update-status/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
};

export const createProducerProfile = (form: ProducerProfileType) => {
    return apiFetch(`${API_URL}/producer/create`, {
        method: 'POST',
        body: JSON.stringify(form)
    });
};

export const readProducerProfile = () => {
    return apiFetch(`${API_URL}/producer/read`);
};

export const updateProducerProfile = (form: ProducerProfileType) => {
    return apiFetch(`${API_URL}/producer/update`, {
        method: 'PATCH',
        body: JSON.stringify(form)
    });
};

export const updateProducerStatus = (id: string, status: string) => {
    return apiFetch(`${API_URL}/producer/update-status/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
    });
};

export const deleteProducerProfile = () => {
    return apiFetch(`${API_URL}/producer/delete`, { method: 'DELETE' });
};

export const getAllProducers = () => {
    return apiFetch(`${API_URL}/producer/all`);
};

export const createLiteraryProfile = (form: LiteraryProfileType) => {
    return apiFetch(`${API_URL}/literary/create`, {
        method: 'POST',
        body: JSON.stringify(form)
    });
};

export const readLiteraryProfile = () => {
    return apiFetch(`${API_URL}/literary/read`);
};

export const updateLiteraryProfile = (form: LiteraryProfileType) => {
    return apiFetch(`${API_URL}/literary/update`, {
        method: 'PATCH',
        body: JSON.stringify(form)
    });
};

export const deleteLiteraryProfile = () => {
    return apiFetch(`${API_URL}/literary/delete`, { method: 'DELETE' });
};

export const createStudioProfile = (form: StudioProfileType) => {
    return apiFetch(`${API_URL}/studio/create`, {
        method: 'POST',
        body: JSON.stringify(form)
    });
};

export const readStudioProfile = () => {
    return apiFetch(`${API_URL}/studio/read`);
};

export const updateStudioProfile = (form: StudioProfileType) => {
    return apiFetch(`${API_URL}/studio/update`, {
        method: 'PATCH',
        body: JSON.stringify(form)
    });
};

export const deleteStudioProfile = () => {
    return apiFetch(`${API_URL}/studio/delete`, { method: 'DELETE' });
};
