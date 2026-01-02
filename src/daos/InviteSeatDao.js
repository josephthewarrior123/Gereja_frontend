import ApiRequest from '../utils/ApiRequest';

export default class InviteSeatCustomerDAO {
   
    static getAll = async () => {
        return await ApiRequest.set('/v1/invite-seats', 'GET');
    };


    static getByInvitationId = async (invitationId) => {
        return await ApiRequest.set(`/v1/invitee-seats/invitation/${invitationId}`, 'GET');
    };


}