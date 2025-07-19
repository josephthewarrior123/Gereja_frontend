import ApiRequest from '../utils/ApiRequest';

export default class StudioSeatDao {
    static getBySeatStudioId = async (studioId) => {
        return await ApiRequest.set(
            `/v1/studio-seats/studio/${studioId}`, 
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    static createMany = async (body) => {
        return await ApiRequest.set(
            '/v1/studio-seats',
            ApiRequest.HTTP_METHOD.POST,
            body,
        );
}

    static UpdateStudioSeat = async (studioSeatId, body) => { 
        return await ApiRequest.set(
            `/v1/studio-seats/${studioSeatId}`,  
            ApiRequest.HTTP_METHOD.PUT,
            body,
        );
    }

    static editSeatConfiguration = async (body) => {
        return await ApiRequest.set(
            '/v1/studio-seats/edit-configuration',
            ApiRequest.HTTP_METHOD.PUT,
            body,
        );
    };


    static getBySeatId = async (seatId) => {
        return await ApiRequest.set(
            `/v1/studio-seats/${seatId}`,  
            ApiRequest.HTTP_METHOD.GET,
        );
    };


}