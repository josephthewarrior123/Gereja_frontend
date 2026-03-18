// src/daos/UserDAO.js
import ApiRequest from '../utils/ApiRequest';

export default class UserDAO {
    // Login user
    static login = async (body) => {
        return await ApiRequest.set(
            '/api/users/login',
            ApiRequest.HTTP_METHOD.POST,
            body,
        );
    };

    static loginGoogle = async (accessToken) => {
        return await ApiRequest.set(
            '/api/auth/google',
            ApiRequest.HTTP_METHOD.POST,
            { accessToken },
        );
    };

    static updateGroups = async (username, groups) => {
        return await ApiRequest.set(
            `/api/users/me/groups`,
            ApiRequest.HTTP_METHOD.PATCH,
            { groups },
        );
    };

    // Sign up new user
    static signUp = async (body) => {
        return await ApiRequest.set(
            '/api/users/signup',
            ApiRequest.HTTP_METHOD.POST,
            body,
        );
    };

    // Get user profile (protected route)
    static getProfile = async () => {
        return await ApiRequest.set(
            '/api/users/profile',
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    // Update user profile (protected route)
    static updateProfile = async (body) => {
        return await ApiRequest.set(
            '/api/users/profile',
            ApiRequest.HTTP_METHOD.PUT,
            body,
        );
    };

    // Change password (protected route)
    static changePassword = async (body) => {
        return await ApiRequest.set(
            '/api/users/change-password',
            ApiRequest.HTTP_METHOD.PUT,
            body,
        );
    };

    // Get all users - admin & super_admin only
    static getAllUsers = async () => {
        return await ApiRequest.set(
            '/api/users',
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    // Set user role - admin & super_admin only
    static setUserRole = async (username, body) => {
        return await ApiRequest.set(
            `/api/users/${username}/role`,
            ApiRequest.HTTP_METHOD.PUT,
            body,
        );
    };

    // Get current user stats (total_points, entry_count) — all time
    static getMyStats = async () => {
        return await ApiRequest.set(
            '/api/users/me/stats',
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    // Get current user monthly stats — filter by year & month
    // year dan month opsional, default ke bulan/tahun sekarang di backend
    static getMyMonthlyStats = async (year, month) => {
        const params = new URLSearchParams();
        if (year) params.append('year', year);
        if (month) params.append('month', month);
        const query = params.toString() ? `?${params.toString()}` : '';
        return await ApiRequest.set(
            `/api/users/me/monthly-stats${query}`,
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    // Legacy method for backward compatibility
    static getSelfData = async () => {
        return await this.getProfile();
    };
}