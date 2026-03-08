import ApiRequest from '../utils/ApiRequest';

export default class AdminDAO {
    // POST /api/admin/users — buat atau update user
    // butuh auth, role: admin / super_admin
    static upsertUser = async (body) => {
        // body: { uid?, email?, name?, phone_number?, groups?, role?, is_active? }
        // uid atau email wajib salah satu
        return await ApiRequest.set(
            '/api/admin/users',
            ApiRequest.HTTP_METHOD.POST,
            body,
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
            ApiRequest.HTTP_METHOD.PUT,
            body,
        );
    };
}