import ApiConfig from './ApiConfig';

export default class ApiRequest {
    static set = async (endpoint, method, body, apiUrl = null) => {
        const token = localStorage.getItem('token');
        const request = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: !!token ? `bearer ${token}` : null,
                Accept: 'application/json',
            },
            body: body && JSON.stringify(body),
        };

        const baseURL = apiUrl || ApiConfig.base_url;
        const response = await fetch(baseURL + endpoint, request);
        if (response.ok) {
            return await response.json();
        }

        const error = await response.json();

        if (
            error.code === 'NO_TOKEN_PROVIDED' ||
            error.code === 'INVALID_TOKEN' ||
            error.code === 'BAD_TOKEN_FORMAT' ||
            error.code === 'NO_SECRET_DEFINED' ||
            error.code === 'JWT_EXPIRED' ||
            error.code === 'JWT_MALFORMED' ||
            error.code === 'SUBSCRIPTION_EXPIRED' ||
            error.code === 'INVALID_SIGNATURE'
        ) {
            throw { message: 'TOKEN_EXPIRED' };
        }

        throw error;
    };

    static HTTP_METHOD = {
        GET: 'GET',
        POST: 'POST',
        PUT: 'PUT',
        DELETE: 'DELETE',
    };
}
