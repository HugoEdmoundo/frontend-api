import api from './api';

export interface Book {
  id: number;
  title: string;
  author: string;
  publisher?: string;
  year_published?: number;
  isbn?: string;
  quantity: number;
  created_at?: string;
  updated_at?: string;
}

export interface BookFormData {
  title: string;
  author: string;
  publisher?: string;
  year_published?: number;
  isbn?: string;
  quantity: number;
}

export interface ApiResponse<T> {
  status: string;
  data: T;
  total?: number;
  message?: string;
}

export const bookService = {
  async getAll(): Promise<Book[]> {
    const response = await api.get<ApiResponse<Book[]> | Book[]>('/books');
    
    // Handle both response formats
    if (Array.isArray(response.data)) {
      // If response.data is directly an array
      return response.data;
    } else if (response.data && response.data.data) {
      // If response.data has {status: 'success', data: [...]}
      return response.data.data;
    } else {
      // Fallback
      console.error('Unexpected response format:', response.data);
      return [];
    }
  },

  async getById(id: number): Promise<Book> {
    const response = await api.get<ApiResponse<Book> | Book>(`/books/${id}`);
    
    if (response.data && 'data' in response.data) {
      return response.data.data;
    }
    return response.data as Book;
  },

  async create(bookData: BookFormData): Promise<any> {
    const response = await api.post('/books', bookData);
    return response.data;
  },

  async update(id: number, bookData: BookFormData): Promise<any> {
    const response = await api.put(`/books/${id}`, bookData);
    return response.data;
  },

  async delete(id: number): Promise<any> {
    const response = await api.delete(`/books/${id}`);
    return response.data;
  }
};