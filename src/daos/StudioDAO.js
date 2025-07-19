// StudioDAO.js

import ApiRequest from '../utils/ApiRequest';

export default class StudioDAO {
    static getByCinemaId = async (cinemaId, params) => {
        return await ApiRequest.set(
            `/v1/studios/cinema/${cinemaId}?${new URLSearchParams(params)}`,
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    static create = async (body) => {
        return await ApiRequest.set(
            '/v1/studio',
            ApiRequest.HTTP_METHOD.POST,
            body,
        );
    };

    static getById = async (studioId) => {
    return await ApiRequest.set(
        `/v1/studio/${studioId}`,
        ApiRequest.HTTP_METHOD.GET
    );
};


    // Tambahkan fungsi baru untuk update active status
    static updateActiveStatus = async (studioId, active) => {
        return await ApiRequest.set(
            `/v1/studio/${studioId}/active`,
            ApiRequest.HTTP_METHOD.PUT,
            { active },
        );
    };

    static updateName = async (studioId, name) => {
        return await ApiRequest.set(
            `/v1/studio/${studioId}/name`,
            ApiRequest.HTTP_METHOD.PUT,
            { name },
        );
    };
    
}