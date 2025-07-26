import axios from 'axios';

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle token errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle token-related errors
      if (status === 401 && data.code) {
        // Clear token and user data for specific error codes
        if (["TOKEN_EXPIRED", "INVALID_TOKEN", "USER_NOT_FOUND"].includes(data.code)) {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          
          // Dispatch a custom event that components can listen to
          window.dispatchEvent(new CustomEvent('auth:tokenInvalid', { 
            detail: { message: data.message }
          }));
        }
      }

      // Create a more descriptive error message
      const errorMessage = data.message || 'An error occurred';
      return Promise.reject(new ApiError(status, errorMessage, data));
    }
    return Promise.reject(new ApiError(500, 'Network error'));
  }
);

// Types
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
}

export interface ShareSettings {
  isPublic: boolean;
  permission: 'view' | 'edit' | 'comment';
  allowComments: boolean;
  expiresIn: 'never' | '1d' | '7d' | '30d';
}

export interface SharedUser {
  id: string;
  email: string;
  permission: 'view' | 'edit' | 'comment';
  avatar?: string;
}

export interface ShareDocument {
  id: string;
  title: string;
  content: string;
  shareSettings: ShareSettings;
  sharedUsers: SharedUser[];
}

// Auth API calls
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      // Store token and user data in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('userId', response.data.user.id);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new ApiError(401, 'Invalid email or password');
      }
      throw error;
    }
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/auth/register', credentials);
      // Store token and user data in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('userId', response.data.user.id);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        throw new ApiError(400, error.response.data.message || 'Registration failed');
      }
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
  },

  // Delete current user
  deleteAccount: async (): Promise<void> => {
    await api.delete('/users/me');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
  },
};

// User API calls
export const userApi = {
  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/users/profile');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.patch<User>('/users/profile', data);
    return response.data;
  },
};

// Document API calls
export interface Document {
  _id: string;  // MongoDB uses _id
  id?: string;  // For compatibility with frontend
  title: string;
  content: string;
  owner: string;
  collaborators: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  lastModified: string;
  fileType?: string; 
  filename?: string;
}

export const documentApi = {
  getAll: async (): Promise<Document[]> => {
    const response = await api.get<Document[]>('/documents');
    return response.data.map(doc => ({
      ...doc,
      id: doc._id // Ensure id is set for frontend compatibility
    }));
  },

  getById: async (id: string): Promise<Document> => {
    console.log('[API] Getting document by ID:', id);
    const response = await api.get<Document>(`/documents/${id}`);
    console.log('[API] Document details:', {
      id: response.data._id,
      owner: response.data.owner,
      currentUser: localStorage.getItem('userId')
    });
    return {
      ...response.data,
      id: response.data._id // Ensure id is set for frontend compatibility
    };
  },

  create: async (data: { title: string; content?: string }): Promise<Document> => {
    const response = await api.post<Document>('/documents', data);
    return {
      ...response.data,
      id: response.data._id // Ensure id is set for frontend compatibility
    };
  },

  update: async (id: string, data: Partial<Document>): Promise<Document> => {
    const response = await api.put<Document>(`/documents/${id}`, data);
    return {
      ...response.data,
      id: response.data._id // Ensure id is set for frontend compatibility
    };
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/documents/${id}`);
  },

  duplicate: async (id: string): Promise<Document> => {
    const response = await api.post<Document>(`/documents/${id}/duplicate`);
    return {
      ...response.data,
      id: response.data._id // Ensure id is set for frontend compatibility
    };
  },

  share: async (id: string, userId: string): Promise<Document> => {
    const response = await api.post<Document>(`/documents/${id}/share`, { userId });
    return {
      ...response.data,
      id: response.data._id // Ensure id is set for frontend compatibility
    };
  },

  shareDocument: (documentId: string, email: string, options?: { message?: string }) => {
    const token = localStorage.getItem('token');
    return fetch(`/api/documents/${documentId}/share`, {
      method: "POST",
      headers: { 
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    },
      body: JSON.stringify({ email, ...options }),
    }).then(res => {
      if (!res.ok) throw new Error("Failed to share document");
      return res.json();
    });
  },
  
  removeAccess: async (documentId: string, userId: string): Promise<void> => {
    try {
      // Ensure we're using the correct ID format
      const docId = documentId.startsWith('_id:') ? documentId.substring(4) : documentId;
      const userToRemoveId = userId.startsWith('_id:') ? userId.substring(4) : userId;
      
      console.log('[API] Removing access:', { 
        docId, 
        userToRemoveId,
        currentUser: localStorage.getItem('userId')
      });
      
      const response = await api.delete(`/documents/${docId}/users/${userToRemoveId}`);
      console.log('[API] Remove access response:', response);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('[API] Remove access error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          currentUser: localStorage.getItem('userId')
        });
        if (error.response?.status === 404) {
          throw new ApiError(404, 'Document not found');
        }
        if (error.response?.status === 403) {
          throw new ApiError(403, error.response?.data?.message || 'You do not have permission to remove access');
        }
        throw new ApiError(error.response?.status || 500, error.response?.data?.message || 'Failed to remove access');
      }
      throw error;
    }
  },

  importDocument: async (formData: FormData): Promise<Document> => {
    try {
      const response = await api.post<Document>('/documents/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return {
        ...response.data,
        id: response.data._id // Ensure id is set for frontend compatibility
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          throw new ApiError(400, 'Invalid file format or no file selected');
        }
        throw new ApiError(error.response?.status || 500, error.response?.data?.message || 'Failed to import document');
      }
      throw error;
    }
  },
};

// Share API calls
export const shareApi = {
  async shareDocument(documentId: string, settings: ShareSettings): Promise<ShareDocument> {
    console.log('[API] Sharing document:', { documentId, settings });
    const response = await api.post<ShareDocument>(`/documents/${encodeURIComponent(documentId)}/share`, settings);
    console.log('[API] Share document response:', response.data);
    return response.data;
  },

  async inviteUser(documentId: string, email: string, permission: 'view' | 'edit' | 'comment'): Promise<SharedUser> {
    console.log('[API] Inviting user:', { documentId, email, permission });
    const response = await api.post<SharedUser>(`/documents/${encodeURIComponent(documentId)}/invite`, { email, permission });
    console.log('[API] Invite user response:', response.data);
    return response.data;
  },

  async sendShareEmail(documentId: string, email: string, permission: 'view' | 'edit' | 'comment', message?: string): Promise<void> {
    console.log('[API] Sending share email:', { documentId, email, permission, message });
    const response = await api.post(`/documents/${encodeURIComponent(documentId)}/share-email`, {
      email,
      permission,
      message
    });
    console.log('[API] Send share email response:', response.data);
    return response.data;
  },

  async removeUser(documentId: string, userId: string): Promise<void> {
    console.log('[API] Removing user:', { documentId, userId });
    
    // Ensure we're using the correct ID format
    const docId = documentId.startsWith('_id:') ? documentId.substring(4) : documentId;
    const userToRemoveId = userId.startsWith('_id:') ? userId.substring(4) : userId;
    
    console.log('[API] Removing access with formatted IDs:', { docId, userToRemoveId });
    try {
      // First get the document to verify ownership
      const document = await documentApi.getById(docId);
      console.log('[API] Document details:', {
        id: document._id,
        owner: document.owner,
        currentUser: localStorage.getItem('userId') // Log current user ID for debugging
      });
      
      await documentApi.removeAccess(docId, userToRemoveId);
      console.log('[API] User removed successfully');
    } catch (error) {
      console.error('[API] Error removing user:', error);
      throw error;
    }
  },

  async getSharedUsers(documentId: string): Promise<SharedUser[]> {
    console.log('[API] Getting shared users for document:', documentId);
    const response = await api.get<SharedUser[]>(`/documents/${encodeURIComponent(documentId)}/users`);
    console.log('[API] Get shared users response:', response.data);
    return response.data.map(user => ({
      ...user,
      id: user.id // Only use id, as SharedUser does not have _id
    }));
  }
};

// Error handling
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    console.error('[API] Error:', { status, message, data });
  }
}

export default api;