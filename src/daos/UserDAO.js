import ApiRequest from '../utils/ApiRequest';

export default class UserDAO {
    static login = async (body) => {
        return await ApiRequest.set(
            '/v1/user/login',
            ApiRequest.HTTP_METHOD.POST,
            body,
        );
    };

    static getSelfData = async () => {
        return await ApiRequest.set(
            '/v1/user/self',
            ApiRequest.HTTP_METHOD.GET,
        );
    };
}
