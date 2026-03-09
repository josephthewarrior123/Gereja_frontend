import ApiRequest from '../utils/ApiRequest';

export default class AdminDAO {
    // ─────────────────────────────────────────
    // USERS
    // ─────────────────────────────────────────

    // GET /api/admin/users — list users (filtered by managedGroups untuk admin biasa)
    // butuh auth, role: admin / super_admin
    static listUsers = async () => {
        return await ApiRequest.set(
            '/api/admin/users',
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    // POST /api/admin/users — buat atau update user
    // butuh auth, role: admin / super_admin
    static upsertUser = async (body) => {
        // body: { username, fullName?, email?, phone_number?, groups?, role?, is_active?, password? }
        // username wajib; password wajib hanya untuk create user baru (super_admin only)
        return await ApiRequest.set(
            '/api/admin/users',
            ApiRequest.HTTP_METHOD.POST,
            body,
        );
    };

    // DELETE /api/admin/users/:username — hapus user (super_admin only)
    static deleteUser = async (username) => {
        return await ApiRequest.set(
            `/api/admin/users/${username}`,
            ApiRequest.HTTP_METHOD.DELETE,
        );
    };

    // ─────────────────────────────────────────
    // ACTIVITIES
    // ─────────────────────────────────────────

    // GET /api/admin/activities — list semua activities (filtered by managedGroups untuk admin biasa)
    // butuh auth, role: admin / super_admin
    static listAdminActivities = async () => {
        return await ApiRequest.set(
            '/api/admin/activities',
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    // POST /api/admin/activities — buat activity baru
    // butuh auth, role: admin / super_admin
    static createActivity = async (body) => {
        // body: { name, points, fields?, groups, is_active? }
        // fields contoh: [{ key: 'book', type: 'string', required: true }]
        return await ApiRequest.set(
            '/api/admin/activities',
            ApiRequest.HTTP_METHOD.POST,
            body,
        );
    };

    // PATCH /api/admin/activities/:activityId — update activity
    // butuh auth, role: admin / super_admin
    static updateActivity = async (activityId, body) => {
        // body: { name?, points?, fields?, groups?, is_active? }
        return await ApiRequest.set(
            `/api/admin/activities/${activityId}`,
            ApiRequest.HTTP_METHOD.PATCH,
            body,
        );
    };
}