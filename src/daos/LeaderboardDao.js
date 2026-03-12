import ApiRequest from '../utils/ApiRequest';

export default class LeaderboardDAO {
    // GET /api/leaderboard — butuh auth, return global leaderboard
    static getGlobalLeaderboard = async () => {
        return await ApiRequest.set(
            '/api/leaderboard',
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    // GET /api/leaderboard/:group/top3 — butuh auth, return top 3 by group
    static getGroupTop3 = async (group) => {
        return await ApiRequest.set(
            `/api/leaderboard/${group}/top3`,
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    // GET /api/leaderboard/:group — butuh auth, return leaderboard by group
    static getGroupLeaderboard = async (group) => {
        return await ApiRequest.set(
            `/api/leaderboard/${group}`,
            ApiRequest.HTTP_METHOD.GET,
        );
    };
}