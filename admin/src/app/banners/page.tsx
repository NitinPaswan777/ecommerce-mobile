"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Upload, ExternalLink, Image as ImageIcon, X, Check } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  link: string;
  imageUrl: string;
  position: string;
  isActive: boolean;
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    subtitle: "",
    link: "",
    imageUrl: "",
    position: "HERO_1",
    isActive: true
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      const res = await fetch(`${backendUrl}/api/admin/banners`);
      if (res.ok) {
        const data = await res.json();
        setBanners(data);
      }
    } catch (error) {
      console.error("Failed to fetch banners", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      const res = await fetch(`${backendUrl}/api/admin/upload`, {
        method: "POST",
        body: formDataUpload,
      });
      if (res.ok) {
        const { url } = await res.json();
        setFormData(prev => ({ ...prev, imageUrl: url }));
      }
    } catch (error) {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageUrl) return alert("Select an image first");

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
    const method = formData.id ? "PUT" : "POST";
    const url = formData.id ? `${backendUrl}/api/admin/banners/${formData.id}` : `${backendUrl}/api/admin/banners`;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ id: "", title: "", subtitle: "", link: "", imageUrl: "", position: "HERO_1", isActive: true });
        fetchBanners();
      }
    } catch (error) {
      alert("Failed to save banner");
    }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      const res = await fetch(`${backendUrl}/api/admin/banners/${id}`, { method: "DELETE" });
      if (res.ok) fetchBanners();
    } catch (error) {
      alert("Delete failed");
    }
  };

  const openForm = (banner?: Banner) => {
    if (banner) setFormData(banner);
    else setFormData({ id: "", title: "", subtitle: "", link: "", imageUrl: "", position: "HERO_1", isActive: true });
    setIsModalOpen(true);
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="section-title">Storefront Banners</h1>
          <p className="subtitle">Manage the promotional banners displayed horizontally on the home page.</p>
        </div>
        <button className="add-button" onClick={() => openForm()}>
          <Plus size={18} />
          <span>Add New Banner</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-20">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner) => (
            <div key={banner.id} className="chart-section" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
                <img 
                  src={banner.imageUrl} 
                  alt={banner.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                <div style={{ 
                  position: 'absolute', 
                  top: '12px', 
                  right: '12px', 
                  display: 'flex', 
                  gap: '8px' 
                }}>
                  <button onClick={() => openForm(banner)} className="icon-btn" style={{ backgroundColor: 'white' }}>
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => deleteBanner(banner.id)} className="icon-btn" style={{ backgroundColor: '#ef4444', color: 'white' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
                {!banner.isActive && (
                  <div style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>INACTIVE</div>
                )}
              </div>
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{banner.title || "Untitled Banner"}</h3>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem' }}>{banner.subtitle || "No subtitle provided."}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600 }}>
                   <ExternalLink size={14} />
                   <span>{banner.link || "No Link"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-scale-in" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{formData.id ? "Edit Banner" : "New Banner"}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label className="input-label">Title</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="input-label">Position Label</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.position} 
                    placeholder="e.g., HERO_1, PROMO"
                    onChange={(e) => setFormData({...formData, position: e.target.value})} 
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Subtitle</label>
                <textarea 
                  className="form-input" 
                  style={{ height: '80px', resize: 'none' }}
                  value={formData.subtitle} 
                  onChange={(e) => setFormData({...formData, subtitle: e.target.value})} 
                />
              </div>

              <div>
                <label className="input-label">Deep Link (URL)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.link} 
                  placeholder="/category/mens-cloth" 
                  onChange={(e) => setFormData({...formData, link: e.target.value})} 
                />
              </div>

              <div>
                <label className="input-label">Banner Image</label>
                <div style={{ 
                  width: '100%', 
                  aspectRatio: '21/9', 
                  backgroundColor: 'var(--input)', 
                  borderRadius: '12px', 
                  overflow: 'hidden', 
                  border: '2px dashed var(--border)',
                  position: 'relative'
                }}>
                  {uploading ? (
                    <div className="flex-center h-full">Uploading...</div>
                  ) : formData.imageUrl ? (
                    <img src={formData.imageUrl} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex-center h-full flex-col gap-2">
                       <ImageIcon size={32} color="#94a3b8" />
                       <p style={{ color: '#94a3b8', fontSize: '0.75rem' }}>No image selected</p>
                    </div>
                  )}
                  <input type="file" id="upload-banner" hidden onChange={handleFileUpload} accept="image/*" />
                  <label htmlFor="upload-banner" className="icon-btn" style={{ position: 'absolute', bottom: '12px', right: '12px', backgroundColor: 'white', color: 'black' }}>
                    <Upload size={16} />
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="secondary-button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button">
                  {formData.id ? "Update Banner" : "Create Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        .icon-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: 1px solid var(--border);
          cursor: pointer;
          transition: all 0.2s;
        }
        .flex-center {
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}
