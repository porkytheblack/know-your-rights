"use client";

import { useState, useEffect } from 'react';
import { 
  Search, Filter, Plus, FileText, Download, Trash2, RefreshCw, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export default function DocumentsPage() {
    const { token } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [documents, setDocuments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (token) {
            fetchDocuments();
        }
    }, [token]);

    const fetchDocuments = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('http://localhost:8000/api/admin/documents/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDocuments(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Filter docs
    const filteredDocs = documents.filter(doc => 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this document?")) return;
        try {
            const res = await fetch(`http://localhost:8000/api/admin/documents/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setDocuments(docs => docs.filter(d => d.id !== id));
            }
        } catch (e) {
            console.error("Delete failed", e);
        }
    };

    const handleView = (doc: any) => {
        const url = `http://localhost:8000/api/admin/documents/${doc.id}/content?token=${token}`;
        // Since we are using Bearer auth header normally, for a browser navigation window.open
        // we might strictly need to handle auth. But for simplicity, we can try opening it.
        // If auth fails (since we can't pass header easily in window.open), we might need a token param support
        // or fetch blob -> createObjectURL.
        // Let's use the blob approach for better security compliance.
        fetch(`http://localhost:8000/api/admin/documents/${doc.id}/content`, {
             headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.blob())
        .then(blob => {
            const fileURL = window.URL.createObjectURL(blob);
            window.open(fileURL, '_blank');
        })
        .catch(err => alert("Failed to open document: " + err));
    };

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-2.5 text-[var(--gray-400)]" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search documents..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-[var(--gray-300)] rounded-lg focus:ring-2 focus:ring-[var(--primary-blue)] focus:border-transparent outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[var(--gray-300)] text-[var(--gray-700)] rounded-lg hover:bg-[var(--gray-50)] transition-colors">
                        <Filter size={18} />
                        Filter
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary-blue)] text-white rounded-lg hover:bg-[var(--primary-blue-dark)] transition-colors shadow-sm">
                        <Plus size={18} />
                        Upload Document
                    </button>
                </div>
            </div>

            {/* Documents Table */}
            <div className="bg-white border border-[var(--gray-200)] rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[var(--gray-50)] border-b border-[var(--gray-200)] text-[var(--gray-600)] text-sm font-medium">
                            <th className="p-4 w-12"><input type="checkbox" className="rounded border-gray-300" /></th>
                            <th className="p-4">Title</th>
                            <th className="p-4 hidden md:table-cell">Type</th>
                            <th className="p-4 hidden md:table-cell">Category</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 hidden lg:table-cell">Indexed Chunks</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--gray-100)]">
                        {isLoading ? (
                             <tr><td colSpan={7} className="p-8 text-center text-gray-500">Loading documents...</td></tr>
                        ) : filteredDocs.length === 0 ? (
                             <tr><td colSpan={7} className="p-8 text-center text-gray-500">No documents found.</td></tr>
                        ) : (
                            filteredDocs.map((doc) => (
                                <tr key={doc.id} className="hover:bg-[var(--gray-50)] group transition-colors">
                                    <td className="p-4"><input type="checkbox" className="rounded border-gray-300" /></td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-[var(--primary-blue-light)] text-[var(--primary-blue)] flex items-center justify-center shrink-0">
                                                <FileText size={16} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-[var(--gray-900)]">{doc.title}</p>
                                                <p className="text-xs text-[var(--gray-500)] md:hidden">{doc.type || 'Policy'} • {doc.chunk_count} chunks</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 hidden md:table-cell text-sm text-[var(--gray-600)]">{doc.type || 'Policy'}</td>
                                    <td className="p-4 hidden md:table-cell">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {doc.category || 'General'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <StatusBadge status={doc.status || 'Active'} />
                                    </td>
                                    <td className="p-4 hidden lg:table-cell text-sm text-[var(--gray-600)]">{doc.chunk_count}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleView(doc)}
                                                className="p-2 text-gray-400 hover:text-[var(--primary-blue)] hover:bg-blue-50 rounded-lg" title="View">
                                                <Eye size={18} />
                                            </button>
                                            <button className="p-2 text-gray-400 hover:text-[var(--primary-blue)] hover:bg-blue-50 rounded-lg" title="Reindex">
                                                <RefreshCw size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(doc.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Pagination (Mock) */}
            <div className="flex items-center justify-between text-sm text-[var(--gray-500)] px-2">
                <p>Showing {filteredDocs.length} documents</p>
                <div className="flex gap-2">
                    <button className="px-3 py-1 border border-[var(--gray-200)] rounded bg-white disabled:opacity-50" disabled>Previous</button>
                    <button className="px-3 py-1 border border-[var(--gray-200)] rounded bg-white hover:bg-[var(--gray-50)]">Next</button>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        'Active': 'bg-green-100 text-green-700',
        'Processing': 'bg-blue-100 text-blue-700 animate-pulse',
        'Inactive': 'bg-gray-100 text-gray-600',
    };

    return (
        <span className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
            styles[status] || styles['Inactive']
        )}>
            {status === 'Active' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />}
            {status}
        </span>
    );
}
