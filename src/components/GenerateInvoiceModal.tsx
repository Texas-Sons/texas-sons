import React, { useState } from 'react';
import { X, Plus, Trash2, Receipt, Eye, Edit2, CreditCard, FileText } from 'lucide-react';
import { Project, Invoice } from '../types';
import TexasSonsLogo from './TexasSonsLogo';

interface GenerateInvoiceModalProps {
  projects: Project[];
  onClose: () => void;
  onGenerate: (invoice: Omit<Invoice, 'id' | 'ownerId'>) => void;
}

interface LineItem {
  id: string;
  description: string;
  qty: number;
  price: number;
}

interface CustomField {
  id: string;
  name: string;
  value: string;
}

export default function GenerateInvoiceModal({ projects, onClose, onGenerate }: GenerateInvoiceModalProps) {
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [billingMethod, setBillingMethod] = useState<'stripe' | 'manual'>('stripe');
  const [showFullAddress, setShowFullAddress] = useState<boolean>(true);
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: 'Website Design and set up', qty: 1, price: 400 }
  ]);
  
  const [customFields, setCustomFields] = useState<CustomField[]>([
    { id: 'cf1', name: 'Hours', value: '13.4' }
  ]);
  
  const totalAmount = lineItems.reduce((sum, item) => sum + ((item.qty || 0) * (item.price || 0)), 0);
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const addLineItem = () => {
    setLineItems([...lineItems, { id: Math.random().toString(), description: '', qty: 1, price: 0 }]);
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(lineItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { id: Math.random().toString(), name: '', value: '' }]);
  };

  const updateCustomField = (id: string, field: keyof CustomField, value: string) => {
    setCustomFields(customFields.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeCustomField = (id: string) => {
    setCustomFields(customFields.filter(item => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    
    // In a real app, if billingMethod === 'stripe', we'd hit the Stripe API here
    
    onGenerate({
      projectId: selectedProject.id,
      clientName: selectedProject.clientName,
      amount: totalAmount,
      status: 'Draft',
      issueDate: new Date().toISOString(),
      dueDate: new Date(dueDate).toISOString()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div>
            <h3 className="text-lg font-display font-semibold text-stone-900 flex items-center">
              <Receipt className="w-5 h-5 mr-2 text-stone-400" />
              Generate Invoice
            </h3>
            <p className="text-sm text-stone-500 mt-1">Create a new invoice for a client project.</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex bg-stone-200 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('edit')}
                className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'edit' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
              >
                <Edit2 className="w-4 h-4 mr-1.5" />
                Edit
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'preview' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
              >
                <Eye className="w-4 h-4 mr-1.5" />
                Preview
              </button>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {viewMode === 'edit' ? (
            <div className="p-6">
              <form id="invoice-form" onSubmit={handleSubmit} className="space-y-8">
                
                {/* Billing Method Selection */}
                <div>
                  <label className="block text-sm font-medium text-stone-900 mb-3">Billing Method</label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={`cursor-pointer flex items-center p-4 border rounded-xl transition-colors ${billingMethod === 'stripe' ? 'border-orange-500 bg-orange-50/30' : 'border-stone-200 hover:border-stone-300 bg-white'}`}>
                      <input 
                        type="radio" 
                        name="billingMethod" 
                        value="stripe" 
                        checked={billingMethod === 'stripe'}
                        onChange={() => setBillingMethod('stripe')}
                        className="sr-only"
                      />
                      <CreditCard className={`w-5 h-5 mr-3 ${billingMethod === 'stripe' ? 'text-orange-500' : 'text-stone-400'}`} />
                      <div>
                        <p className={`text-sm font-medium ${billingMethod === 'stripe' ? 'text-orange-900' : 'text-stone-900'}`}>Stripe Invoice</p>
                        <p className="text-xs text-stone-500 mt-0.5">Collect payment online via Stripe</p>
                      </div>
                    </label>
                    <label className={`cursor-pointer flex items-center p-4 border rounded-xl transition-colors ${billingMethod === 'manual' ? 'border-orange-500 bg-orange-50/30' : 'border-stone-200 hover:border-stone-300 bg-white'}`}>
                      <input 
                        type="radio" 
                        name="billingMethod" 
                        value="manual" 
                        checked={billingMethod === 'manual'}
                        onChange={() => setBillingMethod('manual')}
                        className="sr-only"
                      />
                      <FileText className={`w-5 h-5 mr-3 ${billingMethod === 'manual' ? 'text-orange-500' : 'text-stone-400'}`} />
                      <div>
                        <p className={`text-sm font-medium ${billingMethod === 'manual' ? 'text-orange-900' : 'text-stone-900'}`}>Generic Invoice</p>
                        <p className="text-xs text-stone-500 mt-0.5">Manual tracking without Stripe</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-3 text-sm font-medium text-stone-700 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={showFullAddress}
                      onChange={(e) => setShowFullAddress(e.target.checked)}
                      className="w-4 h-4 text-orange-600 rounded border-stone-300 focus:ring-orange-500"
                    />
                    <span>Show full address (Street, City, State, Zip)</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">Client / Project</label>
                    <select 
                      required
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                    >
                      <option value="" disabled>Select a project</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.companyName} ({p.clientName})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">Due Date</label>
                    <input 
                      type="date" 
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-stone-700">Line Items</label>
                  </div>
                  
                  <div className="space-y-3">
                    {lineItems.map((item, index) => (
                      <div key={item.id} className="flex items-start gap-3">
                        <div className="flex-1">
                          <input 
                            type="text" 
                            required
                            placeholder="Description (e.g., UI Design, Hosting Setup)"
                            value={item.description}
                            onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                          />
                        </div>
                        <div className="w-24">
                          <input 
                            type="number" 
                            required
                            min="1"
                            step="0.01"
                            placeholder="Qty"
                            value={item.qty || ''}
                            onChange={(e) => updateLineItem(item.id, 'qty', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                          />
                        </div>
                        <div className="w-32 relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-stone-500 sm:text-sm">$</span>
                          </div>
                          <input 
                            type="number" 
                            required
                            min="0"
                            step="0.01"
                            placeholder="Price"
                            value={item.price || ''}
                            onChange={(e) => updateLineItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                            className="w-full pl-7 pr-3 py-2 bg-white border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeLineItem(item.id)}
                          disabled={lineItems.length === 1}
                          className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:hover:text-stone-400 disabled:hover:bg-transparent"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    type="button"
                    onClick={addLineItem}
                    className="mt-3 text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Item
                  </button>
                </div>

                <div className="pt-2 border-t border-stone-100">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-stone-700">Custom Fields (Optional)</label>
                  </div>
                  <div className="space-y-3">
                    {customFields.map((field) => (
                      <div key={field.id} className="flex items-start gap-3">
                        <div className="flex-1">
                          <input 
                            type="text" 
                            placeholder="Name (e.g., Hours, PO Number)"
                            value={field.name}
                            onChange={(e) => updateCustomField(field.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                          />
                        </div>
                        <div className="flex-1">
                          <input 
                            type="text" 
                            placeholder="Value (e.g., 13.4)"
                            value={field.value}
                            onChange={(e) => updateCustomField(field.id, 'value', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeCustomField(field.id)}
                          className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button 
                    type="button"
                    onClick={addCustomField}
                    className="mt-3 text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Custom Field
                  </button>
                </div>

                <div className="pt-4 border-t border-stone-200 flex justify-end">
                  <div className="text-right">
                    <p className="text-sm text-stone-500">Total Amount</p>
                    <p className="text-3xl font-display font-semibold text-stone-900 mt-1">
                      ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            /* PREVIEW MODE */
            <div className="p-8 bg-stone-100 min-h-[500px] flex justify-center">
              <div className="bg-white shadow-sm border border-stone-200 w-full max-w-3xl p-12 rounded-sm text-sm">
                
                <div className="flex justify-between items-start mb-16">
                  {/* Top Left: Logo & From Address */}
                  <div>
                    <div className="mb-6 flex items-center gap-3">
                      <TexasSonsLogo className="w-12 h-12 text-orange-600" />
                      <div className="flex flex-col">
                        <span className="font-texas font-normal text-2xl tracking-wide text-stone-900 leading-none">Texas Sons</span>
                        <span className="text-orange-600 font-sans text-xs font-bold tracking-widest uppercase mt-1">- WEBSITES</span>
                      </div>
                    </div>
                    <div className="text-stone-500 text-xs font-semibold mb-1">From</div>
                    <div className="font-bold text-stone-900 mb-1">Morgan Valdez</div>
                    <div className="text-stone-500 leading-relaxed">
                      {showFullAddress ? (
                        <>
                          9360 U.S. 281, # 6<br />
                          Pleasanton, TX 78064
                        </>
                      ) : (
                        <>Pleasanton, TX</>
                      )}
                    </div>
                  </div>

                  {/* Top Right: Invoice Details */}
                  <div className="text-right flex gap-12">
                    <div className="flex flex-col gap-6">
                      <div>
                        <div className="text-stone-500 font-semibold mb-1">Due date</div>
                        <div className="text-stone-900">{new Date(dueDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</div>
                      </div>
                      <div>
                        <div className="text-stone-500 font-semibold mb-1">Issue date</div>
                        <div className="text-stone-900">{new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-6 text-right">
                      <div>
                        <div className="text-stone-500 font-semibold mb-1">Amount due</div>
                        <div className="text-stone-900 font-bold">${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      </div>
                      <div>
                        <div className="text-stone-500 font-semibold mb-1">Invoice number</div>
                        <div className="text-stone-900"># 1001</div>
                      </div>
                      {customFields.filter(cf => cf.name).map((cf) => (
                        <div key={cf.id}>
                          <div className="text-stone-500 font-semibold mb-1">{cf.name}</div>
                          <div className="text-stone-900">{cf.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bill To */}
                <div className="mb-12">
                  <div className="text-stone-500 font-semibold mb-1 text-xs">Bill to</div>
                  <div className="text-stone-900 font-bold">{selectedProject?.clientName || 'Client Name'}</div>
                  {selectedProject?.companyName && (
                    <div className="text-stone-500 mt-1">{selectedProject.companyName}</div>
                  )}
                </div>

                {/* Table */}
                <table className="w-full text-left mb-8">
                  <thead>
                    <tr className="border-b-2 border-stone-100">
                      <th className="py-3 font-semibold text-stone-900">Item</th>
                      <th className="py-3 font-semibold text-stone-900 text-right w-24">Qty</th>
                      <th className="py-3 font-semibold text-stone-900 text-right w-32">Price</th>
                      <th className="py-3 font-semibold text-stone-900 text-right w-32">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, index) => (
                      <tr key={index} className="border-b border-stone-100">
                        <td className="py-4 text-stone-800">{item.description || 'Item Description'}</td>
                        <td className="py-4 text-stone-800 text-right">{item.qty || 1}</td>
                        <td className="py-4 text-stone-800 text-right">${(item.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-4 text-stone-800 text-right">${((item.qty || 0) * (item.price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-24">
                  <div className="w-64 space-y-3">
                    <div className="flex justify-between text-stone-500">
                      <span>Subtotal</span>
                      <span>${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-stone-500">
                      <span>Tax</span>
                      <span>$0.00</span>
                    </div>
                    <div className="flex justify-between font-bold text-stone-900 pt-3">
                      <span>Total</span>
                      <span>${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex flex-col items-center justify-center pt-8 pb-4">
                  <div className="text-stone-400 text-[10px] font-bold tracking-wider mb-3 uppercase">
                    Invoices Powered By
                  </div>
                  {billingMethod === 'stripe' ? (
                    <div className="px-4 py-1.5 bg-[#f6f9fc] text-[#635BFF] rounded-full font-bold tracking-tight text-sm">
                      stripe
                    </div>
                  ) : (
                    <div className="px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full font-bold tracking-tight text-sm flex items-center">
                      <TexasSonsLogo className="w-4 h-4 mr-1.5" /> 
                      <span className="font-texas font-normal text-lg tracking-wide">Texas Sons</span>
                      <span className="text-[10px] ml-1 opacity-80 uppercase tracking-widest">- WEBSITES</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200 bg-stone-50/50 flex justify-end space-x-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="invoice-form"
            disabled={viewMode === 'preview' && (!selectedProjectId || totalAmount <= 0)}
            onClick={() => {
              if (viewMode === 'preview' && selectedProjectId && totalAmount > 0) {
                // Manually trigger submit if clicked from preview
                const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                handleSubmit(fakeEvent);
              }
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-stone-900 border border-transparent rounded-lg hover:bg-stone-800 focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {billingMethod === 'stripe' ? 'Create Stripe Invoice' : 'Create Generic Invoice'}
          </button>
        </div>
        
      </div>
    </div>
  );
}
