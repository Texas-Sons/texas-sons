import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  X, 
  Loader2, 
  CheckCircle2, 
  Image as ImageIcon, 
  FileText, 
  Utensils, 
  CreditCard, 
  Vote, 
  Wrench, 
  ArrowRight,
  Palette,
  Eye,
  Check,
  AlertCircle
} from 'lucide-react';
import { ClientIntake } from '../types';

interface PhotoScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDossier: (dossier: Partial<ClientIntake>, primaryImageUrl?: string) => void;
}

interface UploadedFilePreview {
  id: string;
  name: string;
  dataUrl: string;
  mimeType: string;
  size: string;
}

export default function PhotoScannerModal({ isOpen, onClose, onApplyDossier }: PhotoScannerModalProps) {
  const [files, setFiles] = useState<UploadedFilePreview[]>([]);
  const [contextHint, setContextHint] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [extractedDossier, setExtractedDossier] = useState<Partial<ClientIntake> | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedHeroIndex, setSelectedHeroIndex] = useState<number>(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

function compressImage(file: File, maxDim = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

  const handleProcessFiles = async (fileList: FileList | File[]) => {
    setScanError(null);
    const newFiles: UploadedFilePreview[] = [];
    const filesArray = Array.from(fileList);

    for (const file of filesArray) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const compressedDataUrl = await compressImage(file);
        const approxSizeBytes = Math.round((compressedDataUrl.length * 3) / 4);
        newFiles.push({
          id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          dataUrl: compressedDataUrl,
          mimeType: 'image/jpeg',
          size: `${(approxSizeBytes / 1024).toFixed(1)} KB`
        });
      } catch (err) {
        console.error("Failed to compress image:", err);
      }
    }

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleScan = async () => {
    if (files.length === 0) {
      setScanError('Please upload at least one photo (menu, business card, or flyer).');
      return;
    }

    setIsScanning(true);
    setScanError(null);

    try {
      const payload = {
        images: files.map(f => ({
          data: f.dataUrl,
          mimeType: f.mimeType
        })),
        contextHint: contextHint.trim() || undefined
      };

      const res = await fetch('/api/extract-dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to scan image. Please try again.');
      }

      setExtractedDossier(data.dossier);
    } catch (err: any) {
      console.error('Scan Error:', err);
      setScanError(err.message || 'Error communicating with AI Vision engine.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleApply = () => {
    if (!extractedDossier) return;
    const heroImage = files[selectedHeroIndex]?.dataUrl;
    onApplyDossier(extractedDossier, heroImage);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-950">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-950/50">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                AI Photo & Menu Scanner
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-mono font-semibold">
                  Gemini 2.5 Flash Vision
                </span>
              </h3>
              <p className="text-xs text-stone-400">
                Upload menus, flyers, business cards, or storefront photos to instantly extract real content, colors, and pricing.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs flex-1">
          
          {/* STEP 1: Upload Zone */}
          {!extractedDossier ? (
            <div className="space-y-4">
              
              {/* Drag and drop area */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-orange-500 bg-orange-500/10' 
                    : 'border-stone-800 hover:border-orange-500/50 bg-stone-950/60 hover:bg-stone-950'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={(e) => e.target.files && handleProcessFiles(e.target.files)}
                  multiple
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />

                <div className="w-14 h-14 rounded-2xl bg-orange-600/10 border border-orange-500/30 flex items-center justify-center text-orange-400 mx-auto mb-3.5 group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>

                <h4 className="text-sm font-bold text-white mb-1">
                  Drag & Drop photos here, or <span className="text-orange-400 underline">browse files</span>
                </h4>
                <p className="text-stone-400 text-xs max-w-md mx-auto leading-relaxed">
                  Upload paper menus, business cards, campaign mailers, storefront signs, or service price sheets (PNG, JPG, WebP).
                </p>
              </div>

              {/* Quick Type Selection Pills */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                  Optional Context Hint (Speeds Up Accuracy):
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Restaurant Food Menu & Prices',
                    'Business Card / Owner Contact',
                    'Campaign Flyer & Endorsements',
                    'Salon & Spa Price List',
                    'Contractor License & Services'
                  ].map((hint, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setContextHint(hint)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        contextHint === hint 
                          ? 'bg-orange-500/20 border-orange-500/50 text-orange-300 font-semibold' 
                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              </div>

              {/* Uploaded Thumbnails Grid */}
              {files.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-300 uppercase tracking-wider text-[11px]">
                      Selected Photos ({files.length}):
                    </span>
                    <button
                      onClick={() => setFiles([])}
                      className="text-stone-500 hover:text-red-400 transition-colors text-[11px]"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {files.map((file, idx) => (
                      <div 
                        key={file.id}
                        className={`relative rounded-xl overflow-hidden border bg-stone-950 group ${
                          selectedHeroIndex === idx ? 'border-orange-500 ring-2 ring-orange-500/40' : 'border-stone-800'
                        }`}
                      >
                        <img 
                          src={file.dataUrl} 
                          alt={file.name} 
                          className="w-full h-28 object-cover"
                        />

                        {/* Top Overlay Badge */}
                        <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedHeroIndex(idx); }}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              selectedHeroIndex === idx 
                                ? 'bg-orange-500 text-white' 
                                : 'bg-black/70 text-stone-300 hover:bg-black'
                            }`}
                          >
                            {selectedHeroIndex === idx ? '★ Hero Image' : 'Set as Hero'}
                          </button>

                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveFile(file.id); }}
                            className="p-1 rounded-full bg-black/80 text-stone-400 hover:text-red-400 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="p-1.5 text-[10px] text-stone-400 truncate bg-stone-950/90 border-t border-stone-800">
                          {file.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {scanError && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{scanError}</span>
                </div>
              )}

            </div>
          ) : (
            /* STEP 2: Extraction Results & Review */
            <div className="space-y-6 animate-in fade-in">
              
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white">AI Vision Extraction Complete!</h4>
                    <p className="text-stone-400 text-xs">
                      Parsed {extractedDossier.services?.length || 0} offerings, brand colors, and contact info from your photos.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setExtractedDossier(null)}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium"
                >
                  Scan Different Photos
                </button>
              </div>

              {/* Parsed Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Identity Summary */}
                <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2.5">
                  <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block">
                    Detected Business Identity
                  </span>
                  
                  <div>
                    <h3 className="text-base font-bold text-white">{extractedDossier.businessName || 'Business Name'}</h3>
                    <p className="text-xs text-stone-400 font-mono mt-0.5">{extractedDossier.category}</p>
                  </div>

                  {extractedDossier.tagline && (
                    <p className="text-xs text-stone-300 italic bg-stone-900/60 p-2 rounded-lg border border-stone-800">
                      "{extractedDossier.tagline}"
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-stone-400">
                    <div><strong>Phone:</strong> {extractedDossier.phone || 'N/A'}</div>
                    <div><strong>Address:</strong> {extractedDossier.address || 'N/A'}</div>
                  </div>
                </div>

                {/* Theme & Brand Palette */}
                <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2.5">
                  <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block">
                    Extracted Brand Palette
                  </span>

                  <div className="flex items-center gap-3">
                    <div 
                      style={{ backgroundColor: extractedDossier.primaryColor || '#00081e' }}
                      className="w-12 h-12 rounded-xl border border-stone-700 shadow-md flex items-center justify-center text-white text-[10px] font-mono font-bold"
                    >
                      Primary
                    </div>

                    <div 
                      style={{ backgroundColor: extractedDossier.accentColor || '#C5A059' }}
                      className="w-12 h-12 rounded-xl border border-stone-700 shadow-md flex items-center justify-center text-stone-900 text-[10px] font-mono font-bold"
                    >
                      Accent
                    </div>

                    <div className="text-xs space-y-0.5">
                      <p className="text-stone-200 font-bold capitalize">Theme: {extractedDossier.theme}</p>
                      <p className="text-stone-400 font-mono text-[11px]">Primary: {extractedDossier.primaryColor}</p>
                      <p className="text-stone-400 font-mono text-[11px]">Accent: {extractedDossier.accentColor}</p>
                    </div>
                  </div>

                  {extractedDossier.badges && extractedDossier.badges.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[10px] font-semibold text-stone-500 uppercase block mb-1">Badges:</span>
                      <div className="flex flex-wrap gap-1">
                        {extractedDossier.badges.map((b, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-[10px] text-stone-300">
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Extracted Services & Menu Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-200 uppercase tracking-wider text-[11px]">
                    Extracted Offerings & Menu Items ({extractedDossier.services?.length || 0}):
                  </span>
                  <span className="text-stone-400 text-[11px]">All items will be populated into the site</span>
                </div>

                <div className="border border-stone-800 rounded-xl overflow-hidden bg-stone-950">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-900 border-b border-stone-800 text-stone-400 text-[10px] uppercase font-bold tracking-wider">
                      <tr>
                        <th className="px-4 py-2.5">Item / Service</th>
                        <th className="px-4 py-2.5">Description</th>
                        <th className="px-4 py-2.5">Price</th>
                        <th className="px-4 py-2.5">Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/60 text-stone-300">
                      {extractedDossier.services?.map((svc, idx) => (
                        <tr key={idx} className="hover:bg-stone-900/40">
                          <td className="px-4 py-2.5 font-bold text-white">{svc.title}</td>
                          <td className="px-4 py-2.5 text-stone-400 max-w-xs truncate">{svc.description}</td>
                          <td className="px-4 py-2.5 font-mono text-orange-400 font-semibold">{svc.price || '—'}</td>
                          <td className="px-4 py-2.5 text-stone-400">{svc.duration || 'Offering'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-stone-800 bg-stone-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-medium transition-colors"
          >
            Cancel
          </button>

          {!extractedDossier ? (
            <button
              onClick={handleScan}
              disabled={files.length === 0 || isScanning}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                files.length === 0 || isScanning
                  ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-orange-950/50 active:scale-95'
              }`}
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-orange-300" />
                  <span>Scanning Photos with Gemini 2.5 Flash...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze & Extract Website Content ({files.length} {files.length === 1 ? 'Photo' : 'Photos'})</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleApply}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-950/50 active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Apply Extracted Content to Website</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
