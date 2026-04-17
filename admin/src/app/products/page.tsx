"use client";

import { 
  Plus, 
  Upload,
  Search, 
  Filter, 
  Edit, 
  Trash2
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { fetchAdminProducts, deleteProduct, bulkUploadProducts } from "@/lib/api";
import Link from "next/link";

export default function ProductsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProducts = () => {
    setLoading(true);
    fetchAdminProducts().then(data => {
      setProducts(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (window.confirm(`Upload "${file.name}"? This will process and import all products in the sheet.`)) {
      setLoading(true);
      try {
        const res = await bulkUploadProducts(file);
        alert(`Successfully imported ${res.count} products!`);
        loadProducts();
      } catch (err) {
        alert("Bulk upload failed. Please check the file format.");
      } finally {
        setLoading(false);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      try {
        await deleteProduct(id);
        loadProducts();
      } catch (error) {
        alert("Failed to delete product");
      }
    }
  };

  if (loading) return <div className="page-container">Loading Products...</div>;

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container animate-fade-in">
      <div className="section-header">
         <h2 className="section-title">Products Management</h2>
         <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleBulkUpload} 
              accept=".xlsx, .xls, .csv" 
              style={{ display: 'none' }} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="nav-link" 
              style={{ 
                backgroundColor: 'var(--bg-card)', 
                color: 'var(--text-primary)', 
                borderRadius: '8px', 
                padding: '0.6rem 1.2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                border: '1px solid var(--border)',
                cursor: 'pointer'
              }}
            >
              <Upload size={18} />
              <span>Bulk Upload</span>
            </button>
            <Link href="/products/add" className="nav-link active" style={{ 
              backgroundColor: 'var(--primary)', 
              color: 'white', 
              borderRadius: '8px', 
              padding: '0.6rem 1.2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              border: 'none',
              textDecoration: 'none'
            }}>
              <Plus size={18} />
              <span>Add Product</span>
            </Link>
         </div>
      </div>

      <div className="chart-section" style={{ padding: '0' }}>
         <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
               <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
               <input 
                 type="text" 
                 placeholder="Search products..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 style={{ 
                   width: '100%', 
                   padding: '0.6rem 1rem 0.6rem 2.5rem', 
                   backgroundColor: 'var(--input)', 
                   border: 'none', 
                   borderRadius: '8px',
                   fontSize: '0.875rem'
                 }} 
               />
            </div>
            <button style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.6rem 1rem', 
              border: '1px solid var(--border)', 
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600
            }}>
               <Filter size={16} />
               <span>Filters</span>
            </button>
         </div>

         <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: '#64748b', fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                     <th style={{ padding: '1.25rem 1.5rem' }}>Product</th>
                     <th style={{ padding: '1.25rem 1.5rem' }}>Category</th>
                     <th style={{ padding: '1.25rem 1.5rem' }}>Price</th>
                     <th style={{ padding: '1.25rem 1.5rem' }}>Inventory</th>
                     <th style={{ padding: '1.25rem 1.5rem' }}>Status</th>
                     <th style={{ padding: '1.25rem 1.5rem' }}>Actions</th>
                  </tr>
               </thead>
               <tbody>
                  {filteredProducts.map((product) => (
                     <tr key={product.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.9375rem' }}>
                        <td style={{ padding: '1.25rem 1.5rem', fontWeight: 600 }}>{product.name}</td>
                        <td style={{ padding: '1.25rem 1.5rem', color: '#64748b' }}>{product.category?.name || 'Uncategorized'}</td>
                        <td style={{ padding: '1.25rem 1.5rem', fontWeight: 700 }}>₹{product.price.toLocaleString()}</td>
                        <td style={{ padding: '1.25rem 1.5rem' }}>
                           <span style={{ 
                             color: product.inventory === 0 ? '#ef4444' : product.inventory < 10 ? '#f59e0b' : '#64748b',
                             fontWeight: 600
                           }}>
                              {product.inventory} units
                           </span>
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem' }}>
                           <span className={`badge ${
                             product.inventory > 10 ? 'badge-success' : 
                             product.inventory > 0 ? 'badge-warning' : 'badge-primary'
                           }`} style={{ backgroundColor: product.inventory === 0 ? '#fee2e2' : '', color: product.inventory === 0 ? '#ef4444' : '' }}>
                             {product.inventory === 0 ? 'Out of Stock' : product.inventory < 10 ? 'Low Stock' : 'Active'}
                           </span>
                        </td>

                        <td style={{ padding: '1.25rem 1.5rem' }}>
                           <div style={{ display: 'flex', gap: '0.5rem' }}>
                             <Link href={`/products/edit/${product.id}`} className="action-btn" title="Edit"><Edit size={16}/></Link>
                             <button 
                               onClick={() => handleDelete(product.id, product.name)} 
                               className="action-btn" 
                               style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }} 
                               title="Delete"
                             >
                               <Trash2 size={16}/>
                             </button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>

         <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Showing {filteredProducts.length} products</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
               <button style={{ padding: '0.4rem 0.8rem', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.8125rem' }}>Prev</button>
               <button style={{ padding: '0.4rem 0.8rem', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.8125rem' }}>Next</button>
            </div>
         </div>
      </div>
    </div>
  );
}
