import ApiConfig from './ApiConfig';

export default class ApiRequest {
    // Regular API call untuk JSON
    static set = async (endpoint, method, body, apiUrl = null) => {
        const token = localStorage.getItem('authToken');

        // Prepare headers
        const headers = {
            'Authorization': token ? `Bearer ${token}` : '',
            'Accept': 'application/json',
        };

        // Determine Content-Type
        let requestBody = body;
        if (body instanceof FormData) {
            // Untuk FormData, JANGAN set Content-Type
            // Biarkan browser set otomatis dengan boundary
            requestBody = body;
        } else if (body) {
            // Untuk JSON data
            headers['Content-Type'] = 'application/json';
            requestBody = JSON.stringify(body);
        }

        const request = {
            method: method,
            headers: headers,
            body: requestBody,
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

    // ⭐ DEDICATED method untuk multipart/form-data (file upload)
    static setMultipart = async (endpoint, method, formData, apiUrl = null) => {
        const token = localStorage.getItem('authToken');

        // Untuk multipart, HANYA set Authorization
        // JANGAN set Content-Type, biar browser auto-set dengan boundary
        const headers = {
            'Authorization': token ? `Bearer ${token}` : '',
            'Accept': 'application/json',
        };

        const request = {
            method: method,
            headers: headers,
            body: formData, // FormData langsung tanpa JSON.stringify
        };

        const baseURL = apiUrl || ApiConfig.base_url;

        console.log(`📤 Uploading to: ${baseURL}${endpoint}`);
        console.log(`📦 FormData entries:`, [...formData.entries()].length);

        const response = await fetch(baseURL + endpoint, request);

        if (response.ok) {
            return await response.json();
        }

        // Handle error response
        let error;
        try {
            error = await response.json();
        } catch (e) {
            // Jika response bukan JSON
            error = {
                error: `HTTP ${response.status}: ${response.statusText}`,
                code: 'HTTP_ERROR'
            };
        }

        // Handle auth errors
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
        PATCH: 'PATCH',
        DELETE: 'DELETE',
    };
}