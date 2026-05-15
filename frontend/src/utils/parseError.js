export const parseError = (error, fallback = 'Something went wrong') =>
  error?.response?.data?.message || error?.message || fallback;

export default parseError;
