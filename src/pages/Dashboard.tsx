import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { bookService } from '../services/books';
import type { Book, BookFormData } from '../services/books'; // Pakai type import
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    author: '',
    publisher: '',
    year_published: undefined,
    isbn: '',
    quantity: 0
  });

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const booksData = await bookService.getAll();
      setBooks(booksData);
    } catch (error) {
      alert('Failed to load books');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year_published' || name === 'quantity' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingBook) {
        await bookService.update(editingBook.id, formData);
        alert('Book updated successfully!');
      } else {
        await bookService.create(formData);
        alert('Book created successfully!');
      }
      
      resetForm();
      await loadBooks();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      publisher: book.publisher || '',
      year_published: book.year_published || undefined,
      isbn: book.isbn || '',
      quantity: book.quantity
    });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await bookService.delete(id);
        alert('Book deleted successfully!');
        await loadBooks();
      } catch (error) {
        alert('Failed to delete book');
      }
    }
  };

  const resetForm = () => {
    setEditingBook(null);
    setFormData({
      title: '',
      author: '',
      publisher: '',
      year_published: undefined,
      isbn: '',
      quantity: 0
    });
  };

  return (
    <Layout title="Manajemen Buku">
      <div className="dashboard-container">
        {/* Form tambah/edit buku */}
        <div className="form-section">
          <h2>{editingBook ? 'Edit Buku' : 'Tambah Buku Baru'}</h2>
          
          <form onSubmit={handleSubmit} className="book-form">
            <div className="form-row">
              <input
                type="text"
                name="title"
                placeholder="Title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="form-input"
              />
              
              <input
                type="text"
                name="author"
                placeholder="Author"
                required
                value={formData.author}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
            
            <div className="form-row">
              <input
                type="text"
                name="publisher"
                placeholder="Publisher"
                value={formData.publisher}
                onChange={handleInputChange}
                className="form-input"
              />
              
              <input
                type="number"
                name="year_published"
                placeholder="Year Published"
                value={formData.year_published || ''}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
            
            <div className="form-row">
              <input
                type="text"
                name="isbn"
                placeholder="ISBN"
                value={formData.isbn}
                onChange={handleInputChange}
                className="form-input"
              />
              
              <input
                type="number"
                name="quantity"
                placeholder="Quantity"
                required
                value={formData.quantity}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
            
            <div className="form-actions">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Saving...' : editingBook ? 'Update Book' : 'Add Book'}
              </button>
              
              {editingBook && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Books Table */}
        <div className="table-section">
          <h2>Daftar Buku ({books.length})</h2>
          
          <div className="table-container">
            <table className="books-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Publisher</th>
                  <th>Year</th>
                  <th>ISBN</th>
                  <th>Quantity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book.id}>
                    <td>{book.title}</td>
                    <td>{book.author}</td>
                    <td>{book.publisher || '-'}</td>
                    <td>{book.year_published || '-'}</td>
                    <td>{book.isbn || '-'}</td>
                    <td>{book.quantity}</td>
                    <td className="actions-cell">
                      <button
                        onClick={() => handleEdit(book)}
                        className="btn-edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(book.id)}
                        className="btn-delete"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {books.length === 0 && (
              <div className="empty-state">
                No books found. Add your first book above.
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;