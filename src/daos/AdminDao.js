// src/daos/AdminDao.js
import ApiRequest from '../utils/ApiRequest';

export default class AdminDAO {
    // ─────────────────────────────────────────
    // USERS
    // ─────────────────────────────────────────

    // GET /api/admin/users
    static listUsers = async () => {
        return await ApiRequest.set(
            '/api/admin/users',
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    // POST /api/admin/users — buat atau update user
    static upsertUser = async (body) => {
        return await ApiRequest.set(
            '/api/admin/users',
            ApiRequest.HTTP_METHOD.POST,
            body,
        );
    };

    // DELETE /api/admin/users/:username
    static deleteUser = async (username) => {
        return await ApiRequest.set(
            `/api/admin/users/${username}`,
            ApiRequest.HTTP_METHOD.DELETE,
        );
    };

    // PATCH /api/admin/users/:username/password — reset password user
    // body: { password }
    // super_admin: bisa reset siapa aja kecuali super_admin lain
    // admin: hanya user di managedGroups-nya, tidak bisa reset admin/gembala lain
    static resetUserPassword = async (username, password) => {
        return await ApiRequest.set(
            `/api/admin/users/${username}/password`,
            ApiRequest.HTTP_METHOD.PATCH,
            { password },
        );
    };

    // GET /api/admin/users/:username/stats
    static getUserStats = async (username) => {
        return await ApiRequest.set(
            `/api/admin/users/${username}/stats`,
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    // ─────────────────────────────────────────
    // ACTIVITIES
    // ─────────────────────────────────────────

    // GET /api/admin/activities
    static listAdminActivities = async () => {
        return await ApiRequest.set(
            '/api/admin/activities',
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    // POST /api/admin/activities
    static createActivity = async (body) => {
        return await ApiRequest.set(
            '/api/admin/activities',
            ApiRequest.HTTP_METHOD.POST,
            body,
        );
    };

    // PATCH /api/admin/activities/:activityId
    static updateActivity = async (activityId, body) => {
        return await ApiRequest.set(
            `/api/admin/activities/${activityId}`,
            ApiRequest.HTTP_METHOD.PATCH,
            body,
        );
    };

    // DELETE /api/admin/activities/:activityId
    static deleteActivity = async (activityId) => {
        return await ApiRequest.set(
            `/api/admin/activities/${activityId}`,
            ApiRequest.HTTP_METHOD.DELETE,
        );
    };
}