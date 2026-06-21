import Link from 'next/link';
import { ArrowRight, ShieldCheck, Bot, BellRing } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0b0f1a] text-slate-200 flex flex-col items-center justify-center p-6">
      {/* Background glowing effects */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl w-full text-center z-10 space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/30 border border-blue-500/30 text-blue-400 text-sm font-medium mb-4">
          <ShieldCheck size={16} />
          <span>Federal PPRA & EPADS Integration</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
          Tender Intelligence for <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            Pakistani Businesses
          </span>
        </h1>

        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Bidora automatically scrapes, classifies, and tracks government tenders. 
          Get personalized alerts, analyze documents with AI, and never miss a bidding deadline again.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all hover:scale-105 shadow-lg shadow-blue-900/50"
          >
            Go to Dashboard <ArrowRight size={18} />
          </Link>
          <Link 
            href="/dashboard/profile" 
            className="flex items-center gap-2 px-8 py-4 bg-[#111827] hover:bg-[#1a2236] border border-[#1e2d45] text-slate-300 rounded-xl font-semibold transition-all"
          >
            Setup Profile
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left">
          <div className="bg-[#111827] border border-[#1e2d45] p-6 rounded-2xl">
            <div className="w-12 h-12 bg-blue-900/50 rounded-xl flex items-center justify-center mb-4">
              <Bot className="text-blue-400" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">AI Tender Assistant</h3>
            <p className="text-sm text-slate-400">Ask questions about specific tenders and get instant answers powered by Google Gemini.</p>
          </div>
          <div className="bg-[#111827] border border-[#1e2d45] p-6 rounded-2xl">
            <div className="w-12 h-12 bg-emerald-900/50 rounded-xl flex items-center justify-center mb-4">
              <ShieldCheck className="text-emerald-400" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Automated Scraping</h3>
            <p className="text-sm text-slate-400">Our pipeline fetches active EPADS data daily so you don't have to navigate clunky government portals.</p>
          </div>
          <div className="bg-[#111827] border border-[#1e2d45] p-6 rounded-2xl">
            <div className="w-12 h-12 bg-purple-900/50 rounded-xl flex items-center justify-center mb-4">
              <BellRing className="text-purple-400" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Smart Alerts</h3>
            <p className="text-sm text-slate-400">Set your specific industry niches and get email notifications 24 hours before your saved tenders close.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
