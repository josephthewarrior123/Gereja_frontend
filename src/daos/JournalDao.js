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
    static getMyEntries = async () => {
        return await ApiRequest.set('/api/journal/my-entries', ApiRequest.HTTP_METHOD.GET);
    };

    // GET /api/journal/groups/:group/entries — entries per group (admin/super_admin)
    static getGroupEntries = async (group) => {
        return await ApiRequest.set(`/api/journal/groups/${group}/entries`, ApiRequest.HTTP_METHOD.GET);
    };
}