"use client";

import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function JobsPage() {
    const { token } = useAuth();
    const [jobs, setJobs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (token) fetchJobs();
    }, [token]);

    const fetchJobs = async () => {
        setIsLoading(true);
        try {
            // Re-using documents endpoint as a proxy for "Ingestion Jobs"
            const res = await fetch("http://localhost:8000/api/admin/documents/?limit=10", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setJobs(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h2 className="text-lg font-semibold text-[var(--gray-900)]">System Activity Log</h2>
                 <button 
                    onClick={fetchJobs}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--gray-600)] hover:text-[var(--primary-blue)] transition-colors"
                 >
                    <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                    Refresh
                 </button>
            </div>

            {/* System Status Indicator */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <div className="relative">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-green-800">System Idle</h3>
                    <p className="text-xs text-green-600">All queues processed. Ready for new documents.</p>
                </div>
            </div>

             {/* Recent Jobs (Documents) */}
             <div className="space-y-4 pt-2">
                <h3 className="text-sm font-medium text-[var(--gray-500)] uppercase tracking-wider">Recently Completed Tasks</h3>
                
                {jobs.map((job) => (
                    <div key={job.id} className="bg-white p-4 rounded-xl border border-[var(--gray-200)] flex items-center gap-4">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                            <CheckCircle size={20} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium text-[var(--gray-900)]">Ingest: {job.title}</h4>
                            <p className="text-sm text-[var(--gray-500)]">
                                Completed on {new Date(job.created_at).toLocaleString()} • {job.chunk_count} chunks indexed
                            </p>
                        </div>
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Success</span>
                    </div>
                ))}

                {jobs.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">No recent activity found.</div>
                )}
            </div>
        </div>
    );
}
