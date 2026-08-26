import React, { useState } from 'react';
import { Plus, Download, Send, MoreHorizontal, FileText, DollarSign, Receipt } from 'lucide-react';
import { Invoice } from '../types';

interface BillingViewProps {
  invoices: Invoice[];
  onNewInvoice: () => void;
}

type FilterState = 'all' | 'pending' | 'paid' | 'overdue';

export default function BillingView({ invoices, onNewInvoice }: BillingViewProps) {
  const [filter, setFilter] = useState<FilterState>('all');

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'Draft': return 'bg-stone-800 text-stone-400 border-stone-700';
      case 'Sent': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Paid': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default: return 'bg-stone-800 text-stone-400 border-stone-700';
    }
  };

  const totalOutstanding = invoices
    .filter(inv => inv.status === 'Sent')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const filteredInvoices = invoices.filter(inv => {
    if (filter === 'all') return true;
    if (filter === 'pending') return inv.status === 'Sent';
    if (filter === 'paid') return inv.status === 'Paid';
    if (filter === 'overdue') {
      return inv.status !== 'Paid' && inv.dueDate && new Date(inv.dueDate) < new Date();
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* ── Page Header ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest font-mono mb-1">REVENUE</p>
          <h1 className="text-2xl font-bold text-stone-100">Billing & Invoicing</h1>
        </div>
        <button 
          onClick={onNewInvoice}
          className="flex items-center gap-2 px-4 py-2 bg-[#C5A059]/90 hover:bg-[#C5A059] text-stone-950 text-xs font-black rounded-xl transition-all cursor-pointer active:scale-95 shadow-lg shadow-[#C5A059]/10"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Invoice</span>
        </button>
      </div>

      {/* ── Metrics ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-2">
        <div className="bg-stone-900 rounded-2xl border border-stone-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest font-mono">Outstanding</p>
            <div className="w-7 h-7 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center text-[#C5A059]">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-[#C5A059]">
            ${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-stone-900 rounded-2xl border border-stone-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest font-mono">Sent</p>
            <div className="w-7 h-7 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Send className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-stone-100">
            {invoices.filter(i => i.status === 'Sent').length}
          </p>
        </div>
        <div className="col-span-2 md:col-span-1 bg-stone-900 rounded-2xl border border-stone-800 p-5 shadow-sm flex flex-col justify-center">
          <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest font-mono mb-2">Total Invoices</p>
          <p className="text-2xl font-bold text-stone-100">{invoices.length}</p>
        </div>
      </div>

      {/* ── Filter Bar ───────────────────────────────────── */}
      <div className="flex gap-1.5">
        {(['all', 'pending', 'paid', 'overdue'] as FilterState[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer capitalize ${
              filter === f
                ? 'bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30'
                : 'bg-stone-900 text-stone-500 border border-stone-800 hover:text-stone-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Invoice Cards ─────────────────────────────────── */}
      <div className="space-y-3">
        {filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-stone-900 border border-stone-800 rounded-2xl">
            <div className="w-12 h-12 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center mb-4">
              <Receipt className="w-6 h-6 text-[#C5A059]" />
            </div>
            <p className="text-sm font-bold text-stone-300">No invoices found</p>
            <p className="text-xs text-stone-600 mt-1">Generate your first invoice to get started.</p>
          </div>
        ) : (
          filteredInvoices.map((invoice) => (
            <div key={invoice.id} className="bg-stone-900 border border-stone-800 rounded-2xl p-4 hover:border-stone-700 transition-all group">
              <div className="flex items-start justify-between gap-4">
                {/* Left: Info */}
                <div className="flex gap-3 items-center min-w-0">
                  <div className="w-10 h-10 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-stone-800 flex items-center justify-center flex-shrink-0 text-stone-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-stone-100 truncate">{invoice.clientName}</span>
                    </div>
                    <p className="text-[10px] font-mono text-[#C5A059] mt-0.5">{invoice.id}</p>
                    <p className="text-[10px] font-mono text-stone-500 mt-0.5">Due {new Date(invoice.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Right: Amount & Status */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-base font-black text-stone-100">
                    ${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className={`text-[9px] font-black font-mono px-2 py-0.5 rounded-full border ${getStatusColor(invoice.status)}`}>
                    {invoice.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Action Row */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-stone-800/60">
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-[#C5A059] bg-[#C5A059]/10 hover:bg-[#C5A059]/20 border border-[#C5A059]/30 rounded-lg transition-all cursor-pointer">
                  <Send className="w-3 h-3" /> Send to Client
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-stone-300 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg transition-all cursor-pointer ml-auto">
                  <Download className="w-3 h-3" /> PDF
                </button>
                <button className="p-1.5 text-stone-500 hover:text-stone-300 bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors border border-stone-700 cursor-pointer">
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
