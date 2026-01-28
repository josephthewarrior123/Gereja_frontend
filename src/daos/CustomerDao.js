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

  // Create new customer (with car price and document status)
  static createCustomer = async (customerData) => {
    return await ApiRequest.set(
      `/api/customers`,
      ApiRequest.HTTP_METHOD.POST,
      customerData,
    );
  };

  // Update customer (with car price and document status)
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

  // Upload car photos - PAKAI setMultipart untuk file upload
  static uploadCarPhotos = async (customerId, formData) => {
    console.log('📸 CustomerDAO: Uploading car photos for customer:', customerId);
    console.log('📦 Files in FormData:', [...formData.entries()].map(([key, val]) => ({
      key,
      name: val.name,
      size: val.size,
      type: val.type
    })));
    
    return await ApiRequest.setMultipart(
      `/api/customers/${customerId}/upload-photos`,
      ApiRequest.HTTP_METHOD.POST,
      formData
    );
  };

  // Upload documents (STNK, SIM, KTP) - OPSIONAL
  static uploadDocuments = async (customerId, formData) => {
    console.log('📄 CustomerDAO: Uploading documents for customer:', customerId);
    console.log('📦 Document files in FormData:', [...formData.entries()].map(([key, val]) => ({
      key,
      name: val.name,
      size: val.size,
      type: val.type
    })));
    
    return await ApiRequest.setMultipart(
      `/api/customers/${customerId}/upload-documents`,
      ApiRequest.HTTP_METHOD.POST,
      formData
    );
  };

  // Search customers
  static searchCustomers = async (query) => {
    return await ApiRequest.set(
      `/api/customers/search?query=${encodeURIComponent(query)}`,
      ApiRequest.HTTP_METHOD.GET,
    );
  };

  // Get customer statistics
  static getCustomerStats = async () => {
    return await ApiRequest.set(
      `/api/customers/stats`,
      ApiRequest.HTTP_METHOD.GET,
    );
  };

  // Get customer count
  static getCustomerCount = async () => {
    return await ApiRequest.set(
      `/api/customers/stats`,
      ApiRequest.HTTP_METHOD.GET,
    );
  };
}