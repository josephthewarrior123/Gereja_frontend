import ApiRequest from '../utils/ApiRequest';

export default class PropertyDAO {
  // Get all properties for current user
  static getAllProperties = async () => {
    return await ApiRequest.set(
      `/api/properties`,
      ApiRequest.HTTP_METHOD.GET,
    );
  };

  // Get property by ID
  static getPropertyById = async (propertyId) => {
    return await ApiRequest.set(
      `/api/properties/${propertyId}`,
      ApiRequest.HTTP_METHOD.GET,
    );
  };

  // Create new property
  static createProperty = async (propertyData) => {
    return await ApiRequest.set(
      `/api/properties`,
      ApiRequest.HTTP_METHOD.POST,
      propertyData,
    );
  };

  // Update property
  static updateProperty = async (propertyId, propertyData) => {
    return await ApiRequest.set(
      `/api/properties/${propertyId}`,
      ApiRequest.HTTP_METHOD.PUT,
      propertyData,
    );
  };

  // Delete property
  static deleteProperty = async (propertyId) => {
    return await ApiRequest.set(
      `/api/properties/${propertyId}`,
      ApiRequest.HTTP_METHOD.DELETE,
    );
  };

  // Upload property photos - PAKAI setMultipart untuk file upload
  static uploadPropertyPhotos = async (propertyId, formData) => {
    console.log('🏠 PropertyDAO: Uploading photos for property:', propertyId);
    console.log('📦 Files in FormData:', [...formData.entries()].map(([key, val]) => ({
      key,
      name: val.name,
      size: val.size,
      type: val.type
    })));
    
    return await ApiRequest.setMultipart(
      `/api/properties/${propertyId}/upload-photos`,
      ApiRequest.HTTP_METHOD.POST,
      formData
    );
  };

  // Upload property documents - PAKAI setMultipart untuk file upload
  static uploadPropertyDocuments = async (propertyId, formData) => {
    console.log('📄 PropertyDAO: Uploading documents for property:', propertyId);
    console.log('📦 Files in FormData:', [...formData.entries()].map(([key, val]) => ({
      key,
      name: val.name,
      size: val.size,
      type: val.type
    })));
    
    return await ApiRequest.setMultipart(
      `/api/properties/${propertyId}/upload-documents`,
      ApiRequest.HTTP_METHOD.POST,
      formData
    );
  };

  // Get property statistics
  static getPropertyStats = async () => {
    return await ApiRequest.set(
      `/api/properties/stats`,
      ApiRequest.HTTP_METHOD.GET,
    );
  };

  // Search properties
  static searchProperties = async (query) => {
    return await ApiRequest.set(
      `/api/properties/search?query=${encodeURIComponent(query)}`,
      ApiRequest.HTTP_METHOD.GET,
    );
  };

  // Get properties by status (Active, Expired, Cancelled)
  static getPropertiesByStatus = async (status) => {
    return await ApiRequest.set(
      `/api/properties/status/${status}`,
      ApiRequest.HTTP_METHOD.GET,
    );
  };

  // Check and update expired policies
  static checkExpiredPolicies = async () => {
    return await ApiRequest.set(
      `/api/properties/check-expired`,
      ApiRequest.HTTP_METHOD.GET,
    );
  };
}