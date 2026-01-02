import ApiRequest from '../utils/ApiRequest';

export default class DataCustomerDAO {
    static getInvitationByUniqueCode = async (uniqueCode) => {
        return await ApiRequest.set(
            `/v1/invite/${uniqueCode}/scan`,
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    static checkIn = async (uniqueCode) => {
        return await ApiRequest.set(
            `/v1/invite/${uniqueCode}/scan`,
            ApiRequest.HTTP_METHOD.POST,
        );
    };
}
