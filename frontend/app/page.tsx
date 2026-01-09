import Link from 'next/link';
import { Users, FileText, Scale, ShieldCheck, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--gray-50)] font-[family-name:var(--font-inter)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--gray-200)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-8 h-8 text-[var(--primary-blue)]" />
            <span className="text-xl font-bold text-[var(--gray-900)]">Labor Rights Assistant</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/about" className="text-[var(--gray-600)] hover:text-[var(--primary-blue)] font-medium text-sm hidden sm:block">
              About
            </Link>
            <Link href="/admin/login" className="text-[var(--gray-600)] hover:text-[var(--primary-blue)] font-medium text-sm hidden sm:block">
              Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-col">
        {/* Hero Section */}
        <section className="bg-white py-20 sm:py-32 border-b border-[var(--gray-200)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center rounded-full border border-[var(--primary-blue-light)] bg-[var(--primary-blue-light)] px-3 py-1 text-sm font-medium text-[var(--primary-blue-dark)] mb-8">
              🏛️ Powered by Kenya Law
            </div>
            <h1 className="text-h1 text-[var(--gray-900)] mb-6 tracking-tight">
              Know Your Rights at Work
            </h1>
            <p className="text-[var(--gray-600)] text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Get instant legal guidance on employment matters, union rights, and workplace safety.
            </p>
            <Link href="/categories" className="btn-primary text-lg px-8 py-4 shadow-lg shadow-blue-500/20">
              Get Started - Free <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <p className="mt-4 text-sm text-[var(--gray-600)]">
              No sign-up required • 100% Anonymous
            </p>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="py-20 bg-[var(--gray-50)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Users className="w-10 h-10 text-[var(--primary-blue)]" />}
                title="Union Rights"
                description="Understand your freedom of association and collective bargaining rights."
              />
              <FeatureCard
                icon={<FileText className="w-10 h-10 text-[var(--primary-blue)]" />}
                title="Contract Review"
                description="Upload your offer letter for an instant fairness check."
              />
              <FeatureCard
                icon={<ShieldCheck className="w-10 h-10 text-[var(--primary-blue)]" />}
                title="Health & Safety"
                description="Learn about workplace safety regulations and compensation."
              />
            </div>
          </div>
        </section>


        {/* How it works */}
        <section className="py-20 bg-[var(--gray-50)] border-t border-[var(--gray-200)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-h2 text-center text-[var(--gray-900)] mb-12">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <Step number="1" title="Choose Topic" desc="Select your area of concern" />
              <Step number="2" title="Ask Question" desc="Type or speak your query" />
              <Step number="3" title="Upload Docs" desc="Optional contract review" />
              <Step number="4" title="Get Advice" desc="Instant legal guidance" />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[var(--gray-900)] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-white" />
            <span className="font-bold text-lg">Labor Rights Assistant</span>
          </div>
          <div className="flex gap-8 text-[var(--gray-300)] text-sm">
          </div>
          <div className="text-[var(--gray-600)] text-sm">
            © 2025 Know Your Rights
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="card hover:border-[var(--primary-blue)] border border-transparent cursor-pointer group">
      <div className="mb-6 bg-[var(--primary-blue-light)] w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-h3 text-[var(--gray-900)] mb-3">{title}</h3>
      <p className="text-[var(--gray-600)] leading-relaxed">{description}</p>
    </div>
  );
}

function Step({ number, title, desc }: { number: string, title: string, desc: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-[var(--primary-blue)] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-lg shadow-blue-500/30">
        {number}
      </div>
      <h4 className="text-h4 text-[var(--gray-900)] mb-2">{title}</h4>
      <p className="text-[var(--gray-600)]">{desc}</p>
    </div>
  );
}
