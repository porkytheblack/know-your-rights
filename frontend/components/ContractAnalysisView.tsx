"use client";

import { CheckCircle, AlertTriangle, XCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type AnalysisResult = {
    overall_score: number;
    assessment_summary: string;
    compliant_terms: { term: string; details: string }[];
    areas_of_concern: { clause: string; risk_level: string; explanation: string; recommendation: string }[];
    missing_clauses: string[];
};

export default function ContractAnalysisView({ result }: { result: AnalysisResult }) {
    const scoreColor = result.overall_score >= 80 ? 'text-green-600' : result.overall_score >= 50 ? 'text-yellow-600' : 'text-red-600';
    const scoreBg = result.overall_score >= 80 ? 'bg-green-100' : result.overall_score >= 50 ? 'bg-yellow-100' : 'bg-red-100';

    return (
        <div className="bg-white rounded-xl border border-[var(--gray-200)] overflow-hidden shadow-sm mt-2 w-full max-w-2xl">
            {/* Header / Score */}
            <div className="p-6 border-b border-[var(--gray-100)] flex items-center justify-between bg-[var(--gray-50)]">
                <div>
                    <h3 className="font-semibold text-[var(--gray-900)] flex items-center gap-2">
                        <FileText size={20} className="text-[var(--primary-blue)]" />
                        Contract Analysis
                    </h3>
                    <p className="text-sm text-[var(--gray-500)] mt-1">AI-powered risk assessment</p>
                </div>
                <div className="text-center">
                    <div className={cn("text-3xl font-bold", scoreColor)}>{result.overall_score}</div>
                    <div className="text-[10px] uppercase font-bold text-[var(--gray-400)] tracking-wider">Score</div>
                </div>
            </div>

            {/* Summary */}
            <div className="p-6">
                <p className="text-[var(--gray-700)] leading-relaxed italic border-l-4 border-[var(--primary-blue)] pl-4 py-1 bg-blue-50/50 rounded-r">
                    "{result.assessment_summary}"
                </p>
            </div>

            {/* Risk Areas */}
            <div className="px-6 pb-6 space-y-4">
                <h4 className="text-sm font-semibold text-[var(--gray-900)] uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle size={16} className="text-[var(--error-red)]" />
                    Areas of Concern
                </h4>
                {result.areas_of_concern.map((item, idx) => (
                    <RiskItem key={idx} item={item} />
                ))}
            </div>

            {/* Compliant Terms */}
             <div className="px-6 pb-6 space-y-3">
                <h4 className="text-sm font-semibold text-[var(--gray-900)] uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle size={16} className="text-[var(--success-green)]" />
                    Compliant Terms
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {result.compliant_terms.map((item, idx) => (
                        <div key={idx} className="bg-green-50 border border-green-100 rounded-lg p-3">
                            <p className="font-medium text-green-800 text-sm">{item.term}</p>
                            <p className="text-xs text-green-600 mt-1">{item.details}</p>
                        </div>
                    ))}
                </div>
            </div>
            
             {/* Missing Clauses */}
             {result.missing_clauses.length > 0 && (
                <div className="px-6 pb-6">
                    <h4 className="text-sm font-semibold text-[var(--gray-900)] uppercase tracking-wider flex items-center gap-2 mb-3">
                        <XCircle size={16} className="text-[var(--gray-500)]" />
                        Missing Standard Clauses
                    </h4>
                    <div className="flex flex-wrap gap-2">
                         {result.missing_clauses.map((clause, idx) => (
                             <span key={idx} className="px-3 py-1 bg-[var(--gray-100)] text-[var(--gray-600)] rounded-full text-xs font-medium border border-[var(--gray-200)]">
                                 {clause}
                             </span>
                         ))}
                    </div>
                </div>
             )}
        </div>
    );
}

function RiskItem({ item }: { item: any }) {
    const [expanded, setExpanded] = useState(false);
    
    const riskColors: any = {
        'High': 'bg-red-50 text-red-700 border-red-100',
        'Medium': 'bg-yellow-50 text-yellow-700 border-yellow-100',
        'Low': 'bg-gray-50 text-gray-700 border-gray-100'
    };

    return (
        <div className={cn("border rounded-lg transition-all", riskColors[item.risk_level] || riskColors['Low'])}>
            <div 
                className="p-4 flex items-start justify-between cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                <div>
                     <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                            "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white border",
                            item.risk_level === 'High' ? 'text-red-600 border-red-200' : 'text-yellow-600 border-yellow-200'
                        )}>
                            {item.risk_level} Risk
                        </span>
                     </div>
                     <p className="font-medium text-sm line-clamp-2 italic">"{item.clause}"</p>
                </div>
                <button className="text-current opacity-60 hover:opacity-100">
                    {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
            </div>
            
            <AnimatePresence>
                {expanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 text-sm opacity-90 border-t border-black/5 pt-3">
                            <p className="mb-2"><span className="font-semibold">Issue:</span> {item.explanation}</p>
                            <p className="font-semibold flex items-center gap-1.5">
                                💡 Recommendation:
                                <span className="font-normal">{item.recommendation}</span>
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
