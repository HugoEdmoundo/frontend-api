import React, { useState, useEffect } from 'react';
import { authService } from '../services/auth';
import './PeminjamanForm.css';

interface User {
  id: number;
  name: string;
  email: string;
}

interface Book {
  id: number;
  title: string;
  author: string;
  quantity: number;
  publisher?: string;
  year_published?: number;
  isbn?: string;
}

interface PeminjamanFormProps {
  onSuccess?: () => void;
}

const PeminjamanForm: React.FC<PeminjamanFormProps> = ({ onSuccess }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBooks, setSelectedBooks] = useState<{ [key: number]: { jumlah: number } }>({});
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const user = authService.getUser();
  const [formData, setFormData] = useState({
    users_id: '', // Perhatikan: users_id bukan user_id
    tanggal_pinjam: new Date().toISOString().split('T')[0],
    tanggal_kembali: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    loadUsers();
    loadBooks();
  }, []);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch('http://localhost:8080/users/simple', {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setUsers(data.data);
        // Set default user jika ada
        if (data.data.length > 0 && !formData.users_id) {
          setFormData(prev => ({
            ...prev,
            users_id: data.data[0].id.toString()
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      setError('Gagal memuat data anggota');
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadBooks = async () => {
    try {
      setLoadingBooks(true);
      const response = await fetch('http://localhost:8080/books', {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });
      
      const data = await response.json();
      console.log('Books API response:', data);
      
      if (data.status === 'success' && data.data) {
        // Map data sesuai dengan struktur database baru
        const booksData = data.data.map((book: any) => ({
          id: book.id,
          title: book.title,
          author: book.author,
          quantity: book.quantity || 0,
          publisher: book.publisher,
          year_published: book.year_published,
          isbn: book.isbn
        }));
        
        // Filter hanya buku dengan quantity > 0
        const availableBooks = booksData.filter((book: Book) => book.quantity > 0);
        setBooks(availableBooks);
        console.log('Available books:', availableBooks);
      }
    } catch (error) {
      console.error('Failed to load books:', error);
      setError('Gagal memuat data buku');
    } finally {
      setLoadingBooks(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBookToggle = (bookId: number, checked: boolean) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    if (checked) {
      setSelectedBooks(prev => ({
        ...prev,
        [bookId]: { jumlah: 1 }
      }));
    } else {
      const newSelected = { ...selectedBooks };
      delete newSelected[bookId];
      setSelectedBooks(newSelected);
    }
  };

  const handleBookQuantityChange = (bookId: number, quantity: number) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    if (quantity > 0 && quantity <= book.quantity) {
      setSelectedBooks(prev => ({
        ...prev,
        [bookId]: { jumlah: quantity }
      }));
    } else if (quantity > book.quantity) {
      alert(`Maksimal ${book.quantity} buku untuk "${book.title}"`);
      setSelectedBooks(prev => ({
        ...prev,
        [bookId]: { jumlah: book.quantity }
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validasi
    if (!formData.users_id) {
      setError('Pilih anggota terlebih dahulu');
      setLoading(false);
      return;
    }

    if (Object.keys(selectedBooks).length === 0) {
      setError('Pilih minimal 1 buku');
      setLoading(false);
      return;
    }

    try {
      const bukuArray = Object.entries(selectedBooks).map(([bookId, data]) => ({
        buku_id: parseInt(bookId),
        jumlah: data.jumlah
      }));

      const payload = {
        users_id: parseInt(formData.users_id), // Perhatikan: users_id bukan user_id
        tanggal_pinjam: formData.tanggal_pinjam,
        tanggal_kembali: formData.tanggal_kembali,
        buku: bukuArray
      };

      console.log('Submitting peminjaman:', payload);

      const response = await fetch('http://localhost:8080/peminjaman', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('Peminjaman response:', data);

      if (response.ok) {
        setSuccess(`✅ Peminjaman berhasil! ID: ${data.data?.id || 'N/A'}`);
        setSelectedBooks({});
        if (onSuccess) onSuccess();
        
        // Refresh data buku
        loadBooks();
      } else {
        setError(`❌ ${data.message || 'Gagal membuat peminjaman'}`);
      }
    } catch (error: any) {
      setError(`❌ ${error.message || 'Terjadi kesalahan jaringan'}`);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedUserName = () => {
    const selectedUser = users.find(u => u.id.toString() === formData.users_id);
    return selectedUser ? selectedUser.name : 'Belum dipilih';
  };

  return (
    <div className="peminjaman-form">
      <h2>📖 Form Peminjaman Buku</h2>
      
      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>👤 Anggota:</label>
          {loadingUsers ? (
            <div className="loading-small">Memuat data anggota...</div>
          ) : users.length === 0 ? (
            <div className="alert warning">⚠️ Tidak ada data anggota</div>
          ) : (
            <>
              <select
                name="users_id"
                value={formData.users_id}
                onChange={handleInputChange}
                required
                className="form-input"
              >
                <option value="">-- Pilih Anggota --</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              <small className="form-help">
                Terpilih: <strong>{getSelectedUserName()}</strong>
              </small>
            </>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>📅 Tanggal Pinjam:</label>
            <input
              type="date"
              name="tanggal_pinjam"
              value={formData.tanggal_pinjam}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>📅 Tanggal Kembali:</label>
            <input
              type="date"
              name="tanggal_kembali"
              value={formData.tanggal_kembali}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>
        </div>

        <div className="books-section">
          <div className="section-header">
            <h3>📚 Pilih Buku</h3>
            <span className="badge">{books.length} buku tersedia</span>
          </div>
          
          {loadingBooks ? (
            <div className="loading">
              <div className="spinner"></div>
              Memuat daftar buku...
            </div>
          ) : books.length === 0 ? (
            <div className="empty">
              ⚠️ Tidak ada buku tersedia di database.
              <br />
              <small>Tambah buku terlebih dahulu di menu Books Management</small>
            </div>
          ) : (
            <>
              <div className="books-list">
                {books.map(book => (
                  <div key={book.id} className={`book-item ${selectedBooks[book.id] ? 'selected' : ''}`}>
                    <div className="book-info">
                      <input
                        type="checkbox"
                        id={`book-${book.id}`}
                        checked={!!selectedBooks[book.id]}
                        onChange={(e) => handleBookToggle(book.id, e.target.checked)}
                        disabled={book.quantity === 0}
                        className="book-checkbox"
                      />
                      <label htmlFor={`book-${book.id}`} className="book-label">
                        <div className="book-title">{book.title}</div>
                        <div className="book-author">✍️ {book.author}</div>
                        <div className="book-details">
                          {book.publisher && <span className="publisher">🏢 {book.publisher}</span>}
                          <span className="quantity">📦 Tersedia: {book.quantity}</span>
                        </div>
                      </label>
                    </div>
                    
                    {selectedBooks[book.id] && (
                      <div className="book-quantity">
                        <div className="quantity-control">
                          <button
                            type="button"
                            onClick={() => handleBookQuantityChange(book.id, Math.max(1, (selectedBooks[book.id]?.jumlah || 1) - 1))}
                            className="quantity-btn"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={book.quantity}
                            value={selectedBooks[book.id].jumlah}
                            onChange={(e) => handleBookQuantityChange(book.id, parseInt(e.target.value) || 1)}
                            className="quantity-input"
                          />
                          <button
                            type="button"
                            onClick={() => handleBookQuantityChange(book.id, Math.min(book.quantity, (selectedBooks[book.id]?.jumlah || 0) + 1))}
                            className="quantity-btn"
                          >
                            +
                          </button>
                        </div>
                        <span className="max-info">max: {book.quantity}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {Object.keys(selectedBooks).length > 0 && (
                <div className="selected-summary">
                  <div className="summary-header">
                    <strong>📋 Buku yang dipilih ({Object.keys(selectedBooks).length})</strong>
                  </div>
                  <div className="summary-items">
                    {Object.entries(selectedBooks).map(([bookId, data]) => {
                      const book = books.find(b => b.id === parseInt(bookId));
                      return book ? (
                        <div key={bookId} className="summary-item">
                          <span className="item-title">{book.title}</span>
                          <span className="item-quantity">{data.jumlah} buku</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={loading || Object.keys(selectedBooks).length === 0}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Menyimpan...
              </>
            ) : (
              '💾 Simpan Peminjaman'
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedBooks({});
              setError('');
              setSuccess('');
            }}
            className="btn btn-secondary"
            disabled={Object.keys(selectedBooks).length === 0}
          >
            🔄 Reset Pilihan
          </button>
        </div>
      </form>
    </div>
  );
};

export default PeminjamanForm;