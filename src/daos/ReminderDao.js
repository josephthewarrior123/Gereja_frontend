// src/daos/ReminderDao.js
import ApiRequest from '../utils/ApiRequest';

export default class ReminderDAO {
    // User: kirim reminder ke diri sendiri
    static sendMyReminder = async () => {
        return await ApiRequest.set(
            `/api/reminders/send`,
            ApiRequest.HTTP_METHOD.POST,
        );
    };

    // Admin only: trigger semua reminder
    static triggerAllReminders = async () => {
        return await ApiRequest.set(
            `/api/reminders/trigger-all`,
            ApiRequest.HTTP_METHOD.POST,
        );
    };
}