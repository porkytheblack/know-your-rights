"use client";

import { useState, useEffect } from 'react';
import { RefreshCw, Save, ExternalLink, Archive, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export default function NewsPage() {
    const { token } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [scrapedCount, setScrapedCount] = useState<number | null>(null);
    const [articles, setArticles] = useState<any[]>([]);

    useEffect(() => {
        if (token) fetchArticles();
    }, [token]);

    const fetchArticles = async () => {
        try {
            const res = await fetch("http://localhost:8000/api/admin/news/", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setArticles(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleScrape = async () => {
        setIsLoading(true);
        setStatus(null);
        setScrapedCount(null);
        try {
            const res = await fetch("http://localhost:8000/api/admin/news/scrape?query=Kenya%20Labor%20Rights%20News&limit=5", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            
            if (!res.ok) throw new Error("Scrape failed");
            
            const data = await res.json();
            setStatus("success");
            setScrapedCount(data.indexed);
            fetchArticles(); // Refresh list
        } catch (error) {
            console.error(error);
            setStatus("error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Remove this article from index?")) return;
        try {
            const res = await fetch(`http://localhost:8000/api/admin/documents/${id}`, {
                 method: 'DELETE',
                 headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                 setArticles(list => list.filter(a => a.id !== id));
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-8">
            {/* Configuration Section */}
            <div className="bg-white p-6 rounded-xl border border-[var(--gray-200)] shadow-sm">
                <h2 className="text-lg font-semibold text-[var(--gray-900)] mb-6">Configure Scraper</h2>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-[var(--gray-700)] mb-2">
                             Keywords (comma separated)
                        </label>
                        <input 
                            type="text" 
                            defaultValue="union strike, labor rights, workers Kenya"
                            className="w-full p-2.5 rounded-lg border border-[var(--gray-300)] focus:ring-2 focus:ring-[var(--primary-blue)] focus:border-transparent outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label className="block text-sm font-medium text-[var(--gray-700)] mb-2">
                                Frequency
                            </label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2">
                                    <input type="radio" name="freq" className="text-[var(--primary-blue)]" /> Daily
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="radio" name="freq" className="text-[var(--primary-blue)]" defaultChecked /> Weekly
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="radio" name="freq" className="text-[var(--primary-blue)]" /> Manual
                                </label>
                            </div>
                         </div>
                         
                          <div>
                            <label className="block text-sm font-medium text-[var(--gray-700)] mb-2">
                                Auto-Index Relevance Threshold
                            </label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="range" 
                                    min="0" max="100" 
                                    defaultValue="80"
                                    className="flex-1 h-2 bg-[var(--gray-200)] rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-sm font-semibold text-[var(--gray-700)] w-12 text-right">80%</span>
                            </div>
                         </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button className="flex items-center gap-2 px-6 py-2.5 bg-[var(--primary-blue)] text-white rounded-lg font-semibold hover:bg-[var(--primary-blue-dark)] transition-colors">
                            <Save size={18} />
                            Save Configuration
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent Articles */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-[var(--gray-900)]">Recent Articles</h2>
                    <button 
                        onClick={handleScrape}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-3 py-1.5 border border-[var(--gray-300)] rounded-lg text-sm hover:bg-[var(--gray-50)] transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={cn(isLoading && "animate-spin")} />
                        {isLoading ? "Scraping..." : "Scrape Now"}
                    </button>
                </div>

                {status === "success" && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                        <CheckCircle size={18} />
                        <span>Successfully indexed {scrapedCount} new articles.</span>
                    </div>
                )}
                
                {status === "error" && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                        <AlertCircle size={18} />
                        <span>Failed to run news scraper. Check server logs.</span>
                    </div>
                )}

                <div className="bg-white border border-[var(--gray-200)] rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                         <thead className="bg-[var(--gray-50)] border-b border-[var(--gray-200)] text-sm font-medium text-[var(--gray-600)]">
                            <tr>
                                <th className="p-4 w-12"><input type="checkbox" /></th>
                                <th className="p-4">Article Title</th>
                                <th className="p-4">Source</th>
                                <th className="p-4">Imported</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-[var(--gray-100)] text-sm">
                            {articles.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-400">
                                        No news articles indexed yet. Click "Scrape Now".
                                    </td>
                                </tr>
                            ) : (
                                articles.map((article: any) => (
                                    <ArticleRow 
                                        key={article.id}
                                        id={article.id}
                                        title={article.title}
                                        source={article.source} // Pass full URL for action
                                        displaySource={new URL(article.source).hostname.replace('www.', '')} // Pass display version
                                        time={new Date(article.created_at).toLocaleDateString()}
                                        relevance={100} // Mock relevancy for now
                                        indexed={true}
                                        onRemove={handleDelete}
                                    />
                                ))
                            )}
                         </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function ArticleRow({ id, title, source, displaySource, time, relevance, indexed, onRemove }: any) {
    const handleView = () => {
         if (source) {
             let url = source;
             if (!url.startsWith('http')) {
                 url = 'https://' + url;
             }
             window.open(url, '_blank');
         } else {
             alert("No source URL available.");
         }
    };

    return (
        <tr className="hover:bg-[var(--gray-50)] transition-colors">
            <td className="p-4"><input type="checkbox" /></td>
            <td className="p-4">
                <div className="font-medium text-[var(--gray-900)]">{title}</div>
                <div className="text-xs text-[var(--gray-500)]">{time}</div>
            </td>
            <td className="p-4 text-[var(--gray-600)]">{displaySource || source}</td>
            <td className="p-4">
                <span className={cn(
                    "font-bold",
                    relevance >= 80 ? "text-green-600" : "text-yellow-600"
                )}>
                    {relevance}%
                </span>
            </td>
            <td className="p-4">
                {indexed ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                        ● Indexed
                    </span>
                ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        ○ Not Indexed
                    </span>
                )}
            </td>
            <td className="p-4 text-right">
                <div className="flex justify-end gap-2">
                    <button 
                        onClick={handleView}
                        className="p-1.5 text-gray-400 hover:text-[var(--primary-blue)] hover:bg-blue-50 rounded">
                        <ExternalLink size={16} />
                    </button>
                    {!indexed ? (
                         <button className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded" title="Index">
                            <CheckCircle size={16} />
                        </button>
                    ) : (
                        <button 
                            onClick={() => onRemove(id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Remove Index">
                             <XCircle size={16} />
                        </button>
                    )}
                     <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                        <Archive size={16} />
                    </button>
                </div>
            </td>
        </tr>
    )
}
