import React, { useState, useEffect } from 'react';
import { authService } from '../services/auth';
import './PeminjamanList.css';

interface Peminjaman {
  id: number;
  user_id: number;
  anggota_nama: string;
  tanggal_pinjam: string;
  tanggal_kembali: string;
  status: string;
  created_at: string;
  detail_buku?: DetailBuku[];
}

interface DetailBuku {
  id: number;
  buku_id: number;
  jumlah: number;
  judul: string;
  penulis: string;
}

const PeminjamanList: React.FC = () => {
  const [peminjaman, setPeminjaman] = useState<Peminjaman[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewDetail, setViewDetail] = useState<number | null>(null);

  useEffect(() => {
    loadPeminjaman();
  }, []);

  const loadPeminjaman = async () => {
  try {
    setLoading(true);
    const response = await fetch('http://localhost:8080/peminjaman', {
      headers: {
        'Authorization': `Bearer ${authService.getToken()}`
      }
    });
    
    const data = await response.json();
    console.log('✅ Peminjaman API Response:', data); // Debug log
    
    if (data.status === 'success') {
      console.log('📊 Data peminjaman:', data.data); // Debug log
      
      // Debug pertama item
      if (data.data && data.data.length > 0) {
        console.log('🔍 First peminjaman item:', data.data[0]);
        console.log('📚 Detail buku dari first item:', data.data[0].detail_buku);
      }
      
      // Load details untuk setiap peminjaman
      const peminjamanWithDetails = await Promise.all(
        data.data.map(async (item: Peminjaman) => {
          console.log(`🔄 Loading details for peminjaman ID ${item.id}`);
          
          try {
            const detailResponse = await fetch(`http://localhost:8080/peminjaman/${item.id}`, {
              headers: {
                'Authorization': `Bearer ${authService.getToken()}`
              }
            });
            
            const detailData = await detailResponse.json();
            console.log(`📖 Detail response for ID ${item.id}:`, detailData);
            
            return {
              ...item,
              detail_buku: detailData.data?.detail_buku || []
            };
          } catch (detailError) {
            console.error(`❌ Error loading details for ID ${item.id}:`, detailError);
            return {
              ...item,
              detail_buku: []
            };
          }
        })
      );
      
      console.log('✅ Final data with details:', peminjamanWithDetails);
      setPeminjaman(peminjamanWithDetails);
    }
  } catch (error) {
    console.error('❌ Error loading peminjaman:', error);
    setError('Gagal memuat data peminjaman');
  } finally {
    setLoading(false);
  }
};

  const handleKembalikan = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin mengembalikan buku ini?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/peminjaman/${id}/kembalikan`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({
          tanggal_dikembalikan: new Date().toISOString().split('T')[0]
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Buku berhasil dikembalikan!');
        loadPeminjaman(); // Refresh data
      } else {
        alert(data.message || 'Gagal mengembalikan buku');
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'dipinjam': return 'status-dipinjam';
      case 'dikembalikan': return 'status-dikembalikan';
      case 'terlambat': return 'status-terlambat';
      default: return '';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'dipinjam': return 'Dipinjam';
      case 'dikembalikan': return 'Dikembalikan';
      case 'terlambat': return 'Terlambat';
      default: return status;
    }
  };

  if (loading) {
    return <div className="loading">Memuat data peminjaman...</div>;
  }

  return (
    <div className="peminjaman-list">
      <div className="header-section">
        <h2>Daftar Peminjaman</h2>
        <button onClick={loadPeminjaman} className="btn-refresh">
          🔄 Refresh
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}

      {peminjaman.length === 0 ? (
        <div className="empty-state">
          Belum ada data peminjaman
        </div>
      ) : (
        <div className="table-container">
          <table className="peminjaman-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Anggota</th>
                <th>Tanggal Pinjam</th>
                <th>Tanggal Kembali</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {peminjaman.map(item => (
                <React.Fragment key={item.id}>
                  <tr>
                    <td>{item.id}</td>
                    <td>{item.anggota_nama}</td>
                    <td>{new Date(item.tanggal_pinjam).toLocaleDateString('id-ID')}</td>
                    <td>{new Date(item.tanggal_kembali).toLocaleDateString('id-ID')}</td>
                    <td>
                      <span className={`status-badge ${getStatusColor(item.status)}`}>
                        {getStatusText(item.status)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => setViewDetail(viewDetail === item.id ? null : item.id)}
                          className="btn-detail"
                        >
                          {viewDetail === item.id ? 'Sembunyikan' : 'Detail'}
                        </button>
                        
                        {item.status === 'dipinjam' && (
                          <button
                            onClick={() => handleKembalikan(item.id)}
                            className="btn-kembalikan"
                          >
                            Kembalikan
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  
                  {viewDetail === item.id && item.detail_buku && item.detail_buku.length > 0 && (
                    <tr className="detail-row">
                      <td colSpan={6}>
                        <div className="detail-section">
                          <h4>Detail Buku:</h4>
                          <table className="detail-table">
                            <thead>
                              <tr>
                                <th>Buku</th>
                                <th>Penulis</th>
                                <th>Jumlah</th>
                              </tr>
                            </thead>
                            <tbody>
                              {item.detail_buku.map(detail => (
                                <tr key={detail.id}>
                                  <td>{detail.judul}</td>
                                  <td>{detail.penulis}</td>
                                  <td>{detail.jumlah}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PeminjamanList;