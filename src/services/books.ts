import api from './api';

// Export interface dulu
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

// Lalu export service
export const bookService = {
  async getAll(): Promise<Book[]> {
    const response = await api.get<Book[]>('/books');
    return response.data;
  },

  async getById(id: number): Promise<Book> {
    const response = await api.get<Book>(`/books/${id}`);
    return response.data;
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