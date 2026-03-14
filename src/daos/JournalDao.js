import ApiRequest from '../utils/ApiRequest';

export default class JournalDAO {
    // GET /api/activities — list activities (semua role, filtered by group)
    static listActivities = async () => {
        return await ApiRequest.set('/api/activities', ApiRequest.HTTP_METHOD.GET);
    };

    // POST /api/admin/activities — buat activity (admin/super_admin)
    // body: { name, points, fields, groups, is_active }
    static createActivity = async (body) => {
        return await ApiRequest.set('/api/admin/activities', ApiRequest.HTTP_METHOD.POST, body);
    };

    // PATCH /api/admin/activities/:id — update activity (admin/super_admin)
    static updateActivity = async (activityId, body) => {
        return await ApiRequest.set(`/api/admin/activities/${activityId}`, ApiRequest.HTTP_METHOD.PATCH, body);
    };

    // POST /api/journal/entries — submit entry
    // body: { activity_id, data, timestamp? }
    static submitEntry = async (body) => {
        return await ApiRequest.set('/api/journal/entries', ApiRequest.HTTP_METHOD.POST, body);
    };

    // GET /api/journal/my-entries — entries milik user sendiri
    static getMyEntries = async ({ limit, cursor } = {}) => {
        const params = new URLSearchParams();
        if (limit) params.set('limit', limit);
        if (cursor) params.set('cursor', cursor);
        const qs = params.toString();
        return await ApiRequest.set(`/api/journal/my-entries${qs ? `?${qs}` : ''}`, ApiRequest.HTTP_METHOD.GET);
    };

    // GET /api/journal/groups/:group/entries — entries per group (admin/super_admin)
    static getGroupEntries = async (group) => {
        return await ApiRequest.set(`/api/journal/groups/${group}/entries`, ApiRequest.HTTP_METHOD.GET);
    };

    // POST /api/journal/bulk-award — bulk award poin ke banyak user sekaligus
    // body: { activity_id, usernames: string[], data?: {}, note?: string, timestamp?: number }
    // role: admin, super_admin, gembala
    static bulkAward = async (body) => {
        return await ApiRequest.set('/api/journal/bulk-award', ApiRequest.HTTP_METHOD.POST, body);
    };
}
