import ApiRequest from '../utils/ApiRequest';

export default class ActivityDAO {
    // GET /api/activities — butuh auth, return activities sesuai role & group user
    static listActivities = async () => {
        return await ApiRequest.set(
            '/api/activities',
            ApiRequest.HTTP_METHOD.GET,
        );
    };
}