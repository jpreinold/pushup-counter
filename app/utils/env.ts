export const getSiteURL = () => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // For server-side
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  // Fallback for local development
  return process.env.NODE_ENV === 'production' 
    ? 'https://your-production-domain.com'  // Replace with your actual production domain
    : 'http://localhost:3000';
}; 