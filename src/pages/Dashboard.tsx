import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { bookService } from '../services/books';
import type { Book, BookFormData } from '../services/books';
import PeminjamanForm from '../components/PeminjamanForm';
import PeminjamanList from '../components/PeminjamanList';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [activeTab, setActiveTab] = useState<'books' | 'peminjaman'>('books');
  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    author: '',
    publisher: '',
    year_published: undefined,
    isbn: '',
    quantity: 0
  });
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (activeTab === 'books') {
      loadBooks();
    }
  }, [activeTab]);

  const loadBooks = async () => {
    try {
      setLoadingBooks(true);
      setError('');
      const booksData = await bookService.getAll();
      
      // Ensure booksData is an array
      if (Array.isArray(booksData)) {
        setBooks(booksData);
      } else {
        console.error('Expected array but got:', booksData);
        setBooks([]);
        setError('Invalid data format received from server');
      }
    } catch (error: any) {
      console.error('Failed to load books:', error);
      setError('Failed to load books. Please check console for details.');
      setBooks([]);
    } finally {
      setLoadingBooks(false);
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
    setError('');

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
      const errorMessage = error.response?.data?.message || error.message || 'Operation failed';
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setFormData({
      title: book.title || '',
      author: book.author || '',
      publisher: book.publisher || '',
      year_published: book.year_published || undefined,
      isbn: book.isbn || '',
      quantity: book.quantity || 0
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

  // Ensure books is always an array for rendering
  const safeBooks = Array.isArray(books) ? books : [];

  return (
    <Layout title="Library Management System">
      <div className="dashboard-container">
        {/* Tabs Navigation */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'books' ? 'active' : ''}`}
            onClick={() => setActiveTab('books')}
          >
            📚 Books Management
          </button>
          <button
            className={`tab ${activeTab === 'peminjaman' ? 'active' : ''}`}
            onClick={() => setActiveTab('peminjaman')}
          >
            📖 Book Borrowing
          </button>
        </div>

        {activeTab === 'books' ? (
          <>
            {/* Book Form */}
            <div className="form-section">
              <h2>{editingBook ? 'Edit Book' : 'Add New Book'}</h2>
              
              {error && <div className="alert error">{error}</div>}
              
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
                    disabled={loading}
                  />
                  
                  <input
                    type="text"
                    name="author"
                    placeholder="Author"
                    required
                    value={formData.author}
                    onChange={handleInputChange}
                    className="form-input"
                    disabled={loading}
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
                    disabled={loading}
                  />
                  
                  <input
                    type="number"
                    name="year_published"
                    placeholder="Year Published"
                    value={formData.year_published || ''}
                    onChange={handleInputChange}
                    className="form-input"
                    disabled={loading}
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group-half">
                    <input
                      type="text"
                      name="isbn"
                      placeholder="ISBN"
                      value={formData.isbn}
                      onChange={handleInputChange}
                      className="form-input"
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="form-group-half">
                    <input
                      type="number"
                      name="quantity"
                      placeholder="Quantity"
                      required
                      value={formData.quantity}
                      onChange={handleInputChange}
                      className="form-input"
                      min="0"
                      disabled={loading}
                    />
                  </div>
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
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Books List */}
            <div className="table-section">
              <div className="section-header">
                <h2>Books List ({safeBooks.length})</h2>
                <button 
                  onClick={loadBooks} 
                  className="btn-refresh"
                  disabled={loadingBooks}
                >
                  {loadingBooks ? 'Loading...' : '🔄 Refresh'}
                </button>
              </div>
              
              {loadingBooks ? (
                <div className="loading">
                  <div className="spinner"></div>
                  Loading books...
                </div>
              ) : safeBooks.length === 0 ? (
                <div className="empty-state">
                  <p>No books found. Add your first book above.</p>
                  <button onClick={loadBooks} className="btn btn-secondary">
                    Try Again
                  </button>
                </div>
              ) : (
                <div className="table-container">
                  <table className="books-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Author</th>
                        <th>Publisher</th>
                        <th>Year</th>
                        <th>Quantity</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {safeBooks.map((book) => (
                        <tr key={book.id}>
                          <td className="id-cell">#{book.id}</td>
                          <td>{book.title || 'No Title'}</td>
                          <td>{book.author || 'No Author'}</td>
                          <td>{book.publisher || '-'}</td>
                          <td>{book.year_published || '-'}</td>
                          <td>
                            <span className={`quantity-badge ${book.quantity > 0 ? 'available' : 'unavailable'}`}>
                              {book.quantity}
                            </span>
                          </td>
                          <td className="actions-cell">
                            <button
                              onClick={() => handleEdit(book)}
                              className="btn-edit"
                              disabled={loading}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(book.id)}
                              className="btn-delete"
                              disabled={loading}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Peminjaman Form */}
            <PeminjamanForm onSuccess={() => loadBooks()} />
            
            {/* Peminjaman List */}
            <PeminjamanList />
          </>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;