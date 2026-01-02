import ApiRequest from '../utils/ApiRequest';

export default class InvitationCustomerDAO {
    static getAll = async (dataSourceOptions) => {
        const params = new URLSearchParams(dataSourceOptions).toString();
        return await ApiRequest.set(`/v1/invitations?${params}`, 'GET');
    };

    static create = async (body) => {
        return await ApiRequest.set(`/v1/invitation`, 'POST', body);
    };

    static async getByID(id, dataSourceOptions = {}) {
        const params = new URLSearchParams(dataSourceOptions).toString();
        return await ApiRequest.set(`/v1/invitations/${id}?${params}`, 'GET');
    }

    static getSummary = async () => {
        return await ApiRequest.set(
            '/v1/invitation-summary',
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    static createBatch = async (guests, premiereId) => {
        return await ApiRequest.set(`/v1/invitation/premiers/${premiereId}/invite_batch`, 'POST', guests);
    };
    
    static delete = async (id) => {
        return await ApiRequest.set(`/v1/invitation/${id}/hard-delete`, 'DELETE');
    };
    
}

