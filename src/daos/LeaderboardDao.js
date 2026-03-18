// src/daos/LeaderboardDao.js
import ApiRequest from '../utils/ApiRequest';

export default class LeaderboardDAO {
    // GET /api/leaderboard/:group/top3 — return top 3 by group
    static getGroupTop3 = async (group) => {
        return await ApiRequest.set(
            `/api/leaderboard/${group}/top3`,
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    // GET /api/leaderboard/:group — return full leaderboard by group
    static getGroupLeaderboard = async (group) => {
        return await ApiRequest.set(
            `/api/leaderboard/${group}`,
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    // GET /api/leaderboard/:group/monthly?year=&month= — return monthly leaderboard by group
    static getGroupMonthlyLeaderboard = async (group, year, month) => {
        const params = new URLSearchParams();
        if (year) params.append('year', year);
        if (month) params.append('month', month);
        const query = params.toString() ? `?${params.toString()}` : '';
        return await ApiRequest.set(
            `/api/leaderboard/${group}/monthly${query}`,
            ApiRequest.HTTP_METHOD.GET,
        );
    };

}