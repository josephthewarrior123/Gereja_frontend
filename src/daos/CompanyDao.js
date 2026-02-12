import ApiRequest from '../utils/ApiRequest';

export default class CompanyDAO {
  // Get company profile for current user
  static getCompanyProfile = async () => {
    return await ApiRequest.set(
      `/api/company/profile`,
      ApiRequest.HTTP_METHOD.GET,
    );
  };

  // Create company profile (first-time setup)
  static createCompanyProfile = async (profileData) => {
    return await ApiRequest.set(
      `/api/company/profile`,
      ApiRequest.HTTP_METHOD.POST,
      profileData,
    );
  };

  // Update company profile (name, subtitle, city)
  static updateCompanyProfile = async (profileData) => {
    return await ApiRequest.set(
      `/api/company/profile`,
      ApiRequest.HTTP_METHOD.PUT,
      profileData,
    );
  };

  // Upload company logo - PAKAI setMultipart untuk file upload
  static uploadCompanyLogo = async (formData) => {
    console.log('🏢 CompanyDAO: Uploading company logo');
    console.log('📦 Files in FormData:', [...formData.entries()].map(([key, val]) => ({
      key,
      name: val.name,
      size: val.size,
      type: val.type
    })));
    
    return await ApiRequest.setMultipart(
      `/api/company/logo`,
      ApiRequest.HTTP_METHOD.POST,
      formData
    );
  };

  // Delete company logo
  static deleteCompanyLogo = async () => {
    return await ApiRequest.set(
      `/api/company/logo`,
      ApiRequest.HTTP_METHOD.DELETE,
    );
  };
}