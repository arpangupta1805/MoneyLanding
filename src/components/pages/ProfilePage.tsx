import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { EmailChangeVerification } from '../auth/EmailChangeVerification';

export const ProfilePage = () => {
  const { currentUser, updateProfile, verificationState, setVerificationState } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    fatherName: '',
    village: '',
    address: ''
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        fullName: currentUser.fullName || '',
        email: currentUser.email || '',
        phoneNumber: currentUser.phoneNumber || '',
        fatherName: currentUser.fatherName || '',
        village: currentUser.village || '',
        address: currentUser.address || ''
      });
    }
  }, [currentUser]);

  // Show email verification modal when verification state changes
  useEffect(() => {
    if (verificationState && verificationState.verifyType === 'email-change') {
      setShowEmailVerification(true);
    } else {
      setShowEmailVerification(false);
    }
  }, [verificationState]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    try {
      const success = await updateProfile(formData);
      if (success) {
        // If email is being changed, the modal will automatically appear
        // due to the verificationState changing
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    }
  };

  const handleCloseEmailVerification = () => {
    setShowEmailVerification(false);
  };

  const handleVerifyEmail = () => {
    if (!currentUser) return;
    
    // Set verification state for current email
    setVerificationState({
      userId: currentUser.id,
      email: currentUser.email,
      fullName: currentUser.fullName,
      verifyType: 'email-change',
      newEmail: currentUser.email // Same as current email since we're just verifying, not changing
    });
    
    setShowEmailVerification(true);
  };

  if (!currentUser) {
    return <div className="text-center py-10">Please log in to view your profile.</div>;
  }

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-t-xl p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="flex-shrink-0">
              <div className="w-28 h-28 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white text-4xl font-bold shadow-md">
                {currentUser.fullName.charAt(0)}
              </div>
            </div>
            <div className="flex-grow text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{currentUser.fullName}</h1>
              <div className="flex items-center mt-1">
                <p className="text-gray-600 dark:text-gray-300">{currentUser.email}</p>
                {currentUser.isEmailVerified === false && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100">
                    Unverified
                  </span>
                )}
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{currentUser.phoneNumber}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-5 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-300 shadow-sm"
                  >
                    Edit Profile
                  </button>
                )}
                
                {currentUser.isEmailVerified === false && !isEditing && (
                  <button
                    onClick={handleVerifyEmail}
                    className="px-5 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors duration-300 shadow-sm flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Verify Email
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-b-xl shadow-md p-8">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Edit Your Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                  {formData.email !== currentUser.email && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      <span className="inline-block mr-1">⚠️</span>
                      Changing your email will require verification
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Father's Name
                  </label>
                  <input
                    type="text"
                    name="fatherName"
                    value={formData.fatherName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Village
                  </label>
                  <input
                    type="text"
                    name="village"
                    value={formData.village}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-300 shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</h3>
                  <p className="text-base text-gray-900 dark:text-white font-medium">{currentUser.fullName}</p>
                  <div className="h-0.5 w-12 bg-primary-500 mt-1"></div>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</h3>
                  <div className="flex items-center">
                    <p className="text-base text-gray-900 dark:text-white font-medium">{currentUser.email}</p>
                    {currentUser.isEmailVerified === false && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100">
                        Unverified
                      </span>
                    )}
                  </div>
                  <div className="h-0.5 w-12 bg-primary-500 mt-1"></div>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone Number</h3>
                  <p className="text-base text-gray-900 dark:text-white font-medium">{currentUser.phoneNumber}</p>
                  <div className="h-0.5 w-12 bg-primary-500 mt-1"></div>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Father's Name</h3>
                  <p className="text-base text-gray-900 dark:text-white font-medium">{currentUser.fatherName || 'Not provided'}</p>
                  <div className="h-0.5 w-12 bg-primary-500 mt-1"></div>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Village</h3>
                  <p className="text-base text-gray-900 dark:text-white font-medium">{currentUser.village || 'Not provided'}</p>
                  <div className="h-0.5 w-12 bg-primary-500 mt-1"></div>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</h3>
                  <p className="text-base text-gray-900 dark:text-white font-medium">{currentUser.address || 'Not provided'}</p>
                  <div className="h-0.5 w-12 bg-primary-500 mt-1"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Email Change Verification Modal */}
      {showEmailVerification && (
        <EmailChangeVerification onClose={handleCloseEmailVerification} />
      )}
    </>
  );
}; 