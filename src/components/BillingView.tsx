import React from 'react';
import { Plus, Download, Send, MoreHorizontal, FileText } from 'lucide-react';
import { Invoice } from '../types';

interface BillingViewProps {
  invoices: Invoice[];
  onNewInvoice: () => void;
}

export default function BillingView({ invoices, onNewInvoice }: BillingViewProps) {
  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'Draft': return 'bg-stone-100 text-stone-700 border-stone-200';
      case 'Sent': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Paid': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  const totalOutstanding = invoices
    .filter(inv => inv.status === 'Sent')
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="animate-in fade-in duration-500">
      
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-stone-500">Outstanding Revenue</p>
          <p className="text-3xl font-display font-semibold text-stone-900 mt-2">
            ${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-stone-500">Invoices Sent</p>
          <p className="text-3xl font-display font-semibold text-stone-900 mt-2">
            {invoices.filter(i => i.status === 'Sent').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm flex flex-col justify-center items-start">
          <button 
            onClick={onNewInvoice}
            className="w-full flex items-center justify-center px-4 py-3 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5 mr-2" />
            Generate New Invoice
          </button>
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-stone-200 bg-stone-50/50 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-stone-900">Recent Invoices</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Invoice ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-stone-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-stone-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm font-medium text-stone-900">
                      <FileText className="w-4 h-4 mr-2 text-stone-400" />
                      {invoice.id}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-stone-900">{invoice.clientName}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-stone-900">
                      ${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-500">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-3">
                      <button className="text-stone-400 hover:text-orange-600 transition-colors" title="Send to Client">
                        <Send className="w-4 h-4" />
                      </button>
                      <button className="text-stone-400 hover:text-stone-600 transition-colors" title="Download PDF">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="text-stone-400 hover:text-stone-600 transition-colors" title="More Options">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-sm text-stone-500">No invoices generated yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
