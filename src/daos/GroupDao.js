import ApiRequest from '../utils/ApiRequest';

export default class GroupDAO {
    // GET /api/groups — public, no auth
    static listGroups = async () => {
        return await ApiRequest.set(
            '/api/groups',
            ApiRequest.HTTP_METHOD.GET,
            null,
            false // no auth
        );
    };

    // POST /api/groups — auth, role: super_admin / admin
    // body: { name }
    static createGroup = async (body) => {
        return await ApiRequest.set(
            '/api/groups',
            ApiRequest.HTTP_METHOD.POST,
            body,
        );
    };

    // PATCH /api/groups/:id — auth, role: super_admin / admin
    // body: { name }
    static updateGroup = async (id, body) => {
        return await ApiRequest.set(
            `/api/groups/${id}`,
            ApiRequest.HTTP_METHOD.PATCH,
            body,
        );
    };

    // PATCH /api/groups/:id/toggle — auth, role: super_admin / admin
    // body: { isActive: true | false }
    static toggleGroup = async (id, isActive) => {
        return await ApiRequest.set(
            `/api/groups/${id}/toggle`,
            ApiRequest.HTTP_METHOD.PATCH,
            { isActive },
        );
    };

    // DELETE /api/groups/:id — auth, role: super_admin / admin
    static deleteGroup = async (id) => {
        return await ApiRequest.set(
            `/api/groups/${id}`,
            ApiRequest.HTTP_METHOD.DELETE,
        );
    };
}