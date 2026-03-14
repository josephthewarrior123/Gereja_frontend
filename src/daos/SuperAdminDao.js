import ApiRequest from '../utils/ApiRequest';

export default class SuperAdminDAO {
    // POST /api/super-admin/setup
    // TIDAK butuh auth token — diamankan pakai X-Setup-Key header
    // Dipakai sekali untuk bootstrap super_admin pertama
    static setupSuperAdmin = async (body, setupKey) => {
        // body: { uid?, email?, name?, phone_number? }
        // uid atau email wajib salah satu
        return await ApiRequest.set(
            '/api/super-admin/setup',
            ApiRequest.HTTP_METHOD.POST,
            body,
            null,
            { 'x-setup-key': setupKey },
        );
    };

    // POST /api/super-admin/admins — buat atau promote user jadi admin
    // butuh auth, role: super_admin
    static createOrPromoteAdmin = async (body) => {
        // body: { uid?, email?, name?, phone_number?, managed_groups? }
        // managed_groups: ['ranting', 'pemuda']
        return await ApiRequest.set(
            '/api/super-admin/admins',
            ApiRequest.HTTP_METHOD.POST,
            body,
        );
    };

    // PATCH /api/super-admin/admins/:uid/permissions — update permission admin
    // butuh auth, role: super_admin
    static setAdminPermissions = async (uid, body) => {
        // body: { managed_groups, is_active? }
        return await ApiRequest.set(
            `/api/super-admin/admins/${uid}/permissions`,
            ApiRequest.HTTP_METHOD.PUT,
            body,
        );
    };

    // POST /api/super-admin/gembala — promote user jadi gembala
    // butuh auth, role: super_admin
    static createOrPromoteGembala = async (body) => {
        // body: { username, managed_groups? }
        return await ApiRequest.set(
            '/api/super-admin/gembala',
            ApiRequest.HTTP_METHOD.POST,
            body,
        );
    };

    // PATCH /api/super-admin/gembala/:uid/permissions — update permission gembala
    // butuh auth, role: super_admin
    static setGembalaPermissions = async (uid, body) => {
        // body: { managed_groups, is_active? }
        return await ApiRequest.set(
            `/api/super-admin/gembala/${uid}/permissions`,
            ApiRequest.HTTP_METHOD.PATCH,
            body,
        );
    };
}