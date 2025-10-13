import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor - Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token expiration with refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // Check if this is a token expiration error (not login failure)
      const isTokenExpired = error.response?.data?.error === 'Authentication failed' || 
                            error.response?.data?.error === 'Invalid or expired token';
      
      if (isTokenExpired) {
        if (isRefreshing) {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(token => {
              originalRequest.headers.Authorization = 'Bearer ' + token;
              return api(originalRequest);
            })
            .catch(err => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          // No refresh token, logout
          isRefreshing = false;
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        try {
          // Call refresh token endpoint
          const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/auth/refresh-token`,
            { refreshToken }
          );

          if (response.data.success) {
            const { accessToken } = response.data;
            
            // Update tokens in localStorage
            localStorage.setItem('accessToken', accessToken);
            
            // Update the original request with new token
            originalRequest.headers.Authorization = 'Bearer ' + accessToken;
            
            // Process queued requests
            processQueue(null, accessToken);
            
            isRefreshing = false;
            
            // Retry the original request
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, logout user
          processQueue(refreshError, null);
          isRefreshing = false;
          
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          
          return Promise.reject(refreshError);
        }
      } else {
        // Not a token expiration, just regular 401 (wrong credentials, etc.)
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }

    // Handle other error cases
    if (error.response) {
      switch (error.response.status) {
        case 403:
          console.error('Forbidden: You do not have permission to access this resource');
          break;
        case 404:
          console.error('Not Found: The requested resource does not exist');
          break;
        case 500:
          console.error('Server Error: Something went wrong on the server');
          break;
        default:
          console.error('API Error:', error.response.data?.error || 'Unknown error');
      }
    } else if (error.request) {
      console.error('Network Error: No response received from server');
    } else {
      console.error('Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;