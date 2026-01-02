import ApiRequest from '../utils/ApiRequest';


export default class CustomerDAO {
  // Get all customers for current user
  static getAllCustomers = async () => {
    return await ApiRequest.set(
      `/api/customers`,
      ApiRequest.HTTP_METHOD.GET,
    );
  };

  // Get customer by ID
  static getCustomerById = async (customerId) => {
    return await ApiRequest.set(
      `/api/customers/${customerId}`,
      ApiRequest.HTTP_METHOD.GET,
    );
  };

  // Create new customer
  static createCustomer = async (customerData) => {
    return await ApiRequest.set(
      `/api/customers`,
      ApiRequest.HTTP_METHOD.POST,
      customerData,
    );
  };

  // Update customer
  static updateCustomer = async (customerId, customerData) => {
    return await ApiRequest.set(
      `/api/customers/${customerId}`,
      ApiRequest.HTTP_METHOD.PUT,
      customerData,
    );
  };

  // Delete customer
  static deleteCustomer = async (customerId) => {
    return await ApiRequest.set(
      `/api/customers/${customerId}`,
      ApiRequest.HTTP_METHOD.DELETE,
    );
  };

  // Upload car photos
  static uploadCarPhotos = async (customerId, formData) => {
    return await ApiRequest.set(
      `/api/customers/${customerId}/upload-photos`,
      ApiRequest.HTTP_METHOD.POST,
      formData,
      null,
      false, // Don't set content-type for FormData
    );
  };

  // Get customer statistics
  static getCustomerStats = async () => {
    return await ApiRequest.set(
      `/api/customers/stats`,
      ApiRequest.HTTP_METHOD.GET,
    );
  };
}