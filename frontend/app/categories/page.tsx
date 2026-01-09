import Link from 'next/link';
import { Users, FileText, Scale, Briefcase, ChevronRight, ArrowLeft } from 'lucide-react';

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-[var(--gray-50)] flex flex-col items-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-3xl mb-8">
        <Link href="/" className="inline-flex items-center text-[var(--gray-600)] hover:text-[var(--primary-blue)] transition-colors mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Link>
        <h1 className="text-h2 text-[var(--gray-900)] text-center mb-2">
          What can I help you with today?
        </h1>
      </div>

      <div className="w-full max-w-3xl space-y-6">
        <CategoryCard 
          href="/chat?category=union"
          icon={<Users className="w-12 h-12 text-[var(--primary-blue)]" />}
          title="UNION RIGHTS & ASSOCIATION"
          description="Learn about joining unions, strikes, and collective bargaining rights"
        />
        <CategoryCard 
          href="/chat?category=contract"
          icon={<FileText className="w-12 h-12 text-[var(--primary-blue)]" />}
          title="CONTRACT REVIEW"
          description="Review employment contracts, offer letters, and terms of employment"
        />
        <CategoryCard 
          href="/chat?category=health_safety"
          icon={<Scale className="w-12 h-12 text-[var(--primary-blue)]" />}
          title="WORKPLACE HEALTH & SAFETY"
          description="Report concerns, understand safety regulations, and workers' compensation"
        />
        <CategoryCard 
          href="/chat?category=general"
          icon={<Briefcase className="w-12 h-12 text-[var(--primary-blue)]" />}
          title="GENERAL EMPLOYMENT QUESTIONS"
          description="Ask about wages, leave, termination, and other employment matters"
        />
      </div>
    </div>
  );
}

function CategoryCard({ href, icon, title, description }: { href: string, icon: React.ReactNode, title: string, description: string }) {
  return (
    <Link href={href} className="group block">
      <div className="bg-white rounded-xl p-6 sm:p-8 flex items-center gap-6 border border-transparent shadow-sm hover:border-[var(--primary-blue)] hover:shadow-md transition-all">
        <div className="shrink-0 bg-[var(--primary-blue-light)]/30 p-4 rounded-xl group-hover:bg-[var(--primary-blue-light)] transition-colors">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-h3 text-[var(--gray-900)] mb-2">{title}</h3>
          <p className="text-[var(--gray-600)] text-lg">{description}</p>
        </div>
        <div className="text-[var(--primary-blue)] opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
          <div className="bg-[var(--primary-blue-light)] p-2 rounded-full">
            <ChevronRight className="w-6 h-6" />
          </div>
        </div>
      </div>
    </Link>
  );
}
