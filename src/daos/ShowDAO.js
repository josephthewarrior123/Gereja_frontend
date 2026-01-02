import ApiRequest from '../utils/ApiRequest';

export default class ShowCustomerDAO {
    static getById = async (id) => {
        return await ApiRequest.set(
            `/v1/show/${id}`,
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    static getByPremiereId = async (premiereId, filters) => {
        const params = new URLSearchParams(filters).toString();
        return await ApiRequest.set(
            `/v1/shows/premiere/${premiereId}?${params}`,
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    static getByStudioId = async (studioId) => {
        return await ApiRequest.set(
            `/v1/shows/studio/${studioId}`,
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    static deleteById = async (showId) => {
        return await ApiRequest.set(
            `/v1/show/${showId}`,
            ApiRequest.HTTP_METHOD.DELETE,
        );
    };

    static create = async (body) => {
        console.log("Data yang dikirim ke API (ShowCustomerDAO.create):", body); // Debugging
        return await ApiRequest.set(
            '/v1/show',
            ApiRequest.HTTP_METHOD.POST,
            body,
        );
    };

}

