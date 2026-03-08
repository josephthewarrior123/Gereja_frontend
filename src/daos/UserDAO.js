import ApiRequest from '../utils/ApiRequest';

export default class UserDAO {
    // Login user
    static login = async (body) => {
        return await ApiRequest.set(
            '/api/users/login',
            ApiRequest.HTTP_METHOD.POST,
            body,
        );
    };

    // Sign up new user
    static signUp = async (body) => {
        return await ApiRequest.set(
            '/api/users/signup',
            ApiRequest.HTTP_METHOD.POST,
            body,
        );
    };

    // Get user profile (protected route)
    static getProfile = async () => {
        return await ApiRequest.set(
            '/api/users/profile',
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    // Update user profile (protected route)
    static updateProfile = async (body) => {
        return await ApiRequest.set(
            '/api/users/profile',
            ApiRequest.HTTP_METHOD.PUT,
            body,
        );
    };

    // Change password (protected route)
    static changePassword = async (body) => {
        return await ApiRequest.set(
            '/api/users/change-password',
            ApiRequest.HTTP_METHOD.PUT,
            body,
        );
    };

    // Get all users - admin & super_admin only
    static getAllUsers = async () => {
        return await ApiRequest.set(
            '/api/users',
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    // Set user role - admin & super_admin only
    static setUserRole = async (username, body) => {
        return await ApiRequest.set(
            `/api/users/${username}/role`,
            ApiRequest.HTTP_METHOD.PUT,
            body,
        );
    };

    // Legacy method for backward compatibility
    static getSelfData = async () => {
        return await this.getProfile();
    };
}