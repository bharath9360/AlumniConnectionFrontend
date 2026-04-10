/**
 * Extracts and returns a user-friendly error message from an API response
 * or a general Error object.
 *
 * @param {Error} error - The caught error object
 * @returns {string} The formatted error message
 */
export const handleError = (error) => {
  // Check if it's an Axios error with a response from the server
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  // Check if it's a network error (no response received)
  if (error.message === 'Network Error' || !error.response) {
    return "Check your internet connection";
  }

  // Fallback to general error message
  return error.message || "Something went wrong";
};
