import ApiRequest from '../utils/ApiRequest';

export default class GroupDAO {
    // GET /api/groups — butuh auth
    static listGroups = async () => {
        return await ApiRequest.set(
            '/api/groups',
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    // POST /api/groups — butuh auth, role: super_admin / admin
    static createGroup = async (body) => {
        // body: { name }
        return await ApiRequest.set(
            '/api/groups',
            ApiRequest.HTTP_METHOD.POST,
            body,
        );
    };
}