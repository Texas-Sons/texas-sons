import React, { useState, useRef, useEffect } from 'react';
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
  AlertCircle,
  Plus,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { ClientIntake } from '../types';

interface PhotoScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDossier: (dossier: Partial<ClientIntake>, primaryImageUrl?: string, allImages?: string[]) => void;
  existingImages?: string[];
}

interface UploadedFilePreview {
  id: string;
  name: string;
  dataUrl: string;
  mimeType: string;
  size: string;
}

const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

const compressImage = async (file: File, maxDim = 1200, quality = 0.8): Promise<string> => {
  try {
    const rawDataUrl = await readFileAsDataUrl(file);
    if (!rawDataUrl || file.type === 'application/pdf' || file.type.includes('svg')) {
      return rawDataUrl;
    }
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
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
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } else {
            resolve(rawDataUrl);
          }
        } catch {
          resolve(rawDataUrl);
        }
      };
      img.onerror = () => resolve(rawDataUrl);
      img.src = rawDataUrl;
    });
  } catch {
    return '';
  }
};

export default function PhotoScannerModal({ isOpen, onClose, onApplyDossier, existingImages = [] }: PhotoScannerModalProps) {
  const [files, setFiles] = useState<UploadedFilePreview[]>([]);
  const [contextHint, setContextHint] = useState('');
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [extractedDossier, setExtractedDossier] = useState<Partial<ClientIntake> | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedHeroIndex, setSelectedHeroIndex] = useState<number>(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (existingImages && existingImages.length > 0) {
        setFiles(existingImages.map((dataUrl, idx) => ({
          id: `existing-${idx}`,
          name: `Project Image ${idx + 1}`,
          dataUrl,
          mimeType: 'image/jpeg',
          size: 'Saved'
        })));
      } else {
        setFiles([]);
      }
      setContextHint('');
      setScanError(null);
      setExtractedDossier(null);
      setSelectedHeroIndex(0);
      setIsProcessingFiles(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProcessFiles = async (fileList: FileList | File[]) => {
    setScanError(null);
    setIsProcessingFiles(true);

    try {
      const filesArray = Array.from(fileList);
      const results = await Promise.all(
        filesArray.map(async (file) => {
          try {
            const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
            let dataUrl = '';
            let mimeType = file.type || 'image/jpeg';

            if (isPdf) {
              dataUrl = await readFileAsDataUrl(file);
              mimeType = 'application/pdf';
            } else {
              dataUrl = await compressImage(file);
              mimeType = 'image/jpeg';
            }

            if (!dataUrl) return null;

            const approxSizeBytes = Math.round((dataUrl.length * 3) / 4);
            return {
              id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: file.name,
              dataUrl,
              mimeType,
              size: `${(approxSizeBytes / 1024).toFixed(1)} KB`
            } as UploadedFilePreview;
          } catch (e) {
            console.warn('Failed to process file:', file.name, e);
            return null;
          }
        })
      );

      const validFiles = results.filter((f): f is UploadedFilePreview => f !== null);

      if (validFiles.length > 0) {
        setFiles(prev => [...prev, ...validFiles]);
      } else if (filesArray.length > 0) {
        setScanError('Could not process the selected files. Please upload PNG, JPG, or PDF images.');
      }
    } catch (err: any) {
      console.error("Error processing files:", err);
      setScanError('Error reading uploaded files.');
    } finally {
      setIsProcessingFiles(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
    setFiles(prev => {
      const next = prev.filter(f => f.id !== id);
      if (selectedHeroIndex >= next.length) {
        setSelectedHeroIndex(Math.max(0, next.length - 1));
      }
      return next;
    });
  };

  const handleScan = async () => {
    if (files.length === 0) {
      setScanError('Please upload at least one photo (menu, business card, flyer, or sign).');
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
        throw new Error(data.error || 'Failed to scan images with Gemini Vision. Please try again.');
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
    const allImages = files.map(f => f.dataUrl);
    onApplyDossier(extractedDossier, heroImage, allImages);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-stone-200">
        
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
                Upload menus, flyers, business cards, signs, or campaign mailers to auto-extract details, offerings, and color themes.
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
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center cursor-pointer transition-all ${
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
                  accept="image/*,application/pdf"
                  className="hidden"
                />

                <div className="w-14 h-14 rounded-2xl bg-orange-600/10 border border-orange-500/30 flex items-center justify-center text-orange-400 mx-auto mb-3.5 group-hover:scale-105 transition-transform">
                  {isProcessingFiles ? (
                    <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>

                <h4 className="text-sm font-bold text-white mb-1">
                  {isProcessingFiles ? 'Processing uploaded files...' : 'Drag & Drop photos here, or click to browse'}
                </h4>
                <p className="text-stone-400 text-xs max-w-md mx-auto leading-relaxed">
                  Select 1 or multiple photos (PNG, JPG, WebP, PDF) — menus, candidate mailers, storefronts, or price sheets.
                </p>
              </div>

              {/* Quick Type Selection Pills */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                  Optional Context Hint (Speeds Up Extraction):
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Campaign Flyer & Endorsements',
                    'Restaurant Food Menu & Prices',
                    'Business Card / Owner Contact',
                    'Contractor License & Services',
                    'Salon & Spa Price List'
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
                    <span className="font-bold text-stone-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-orange-400" />
                      <span>Uploaded Photos ({files.length}):</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 border border-stone-700"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add More</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFiles([])}
                        className="text-stone-500 hover:text-red-400 transition-colors text-[11px] ml-2"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {files.map((file, idx) => (
                      <div 
                        key={file.id}
                        className={`relative rounded-xl overflow-hidden border bg-stone-950 group ${
                          selectedHeroIndex === idx ? 'border-orange-500 ring-2 ring-orange-500/40' : 'border-stone-800'
                        }`}
                      >
                        {file.mimeType === 'application/pdf' ? (
                          <div className="w-full h-28 flex flex-col items-center justify-center bg-stone-900 text-stone-400 p-2">
                            <FileText className="w-8 h-8 text-orange-400 mb-1" />
                            <span className="text-[10px] truncate max-w-full">{file.name}</span>
                          </div>
                        ) : (
                          <img 
                            src={file.dataUrl} 
                            alt={file.name} 
                            className="w-full h-28 object-cover"
                          />
                        )}

                        {/* Top Overlay Controls */}
                        <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setSelectedHeroIndex(idx); }}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold shadow ${
                              selectedHeroIndex === idx 
                                ? 'bg-orange-500 text-white' 
                                : 'bg-black/75 text-stone-300 hover:bg-black'
                            }`}
                          >
                            {selectedHeroIndex === idx ? '★ Primary Hero' : 'Set as Hero'}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleRemoveFile(file.id); }}
                            className="p-1 rounded-full bg-black/80 text-stone-400 hover:text-red-400 transition-colors shadow"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Bottom File Info */}
                        <div className="p-1.5 bg-stone-950/90 text-[10px] text-stone-400 truncate flex items-center justify-between">
                          <span className="truncate">{file.name}</span>
                          <span className="text-stone-500 text-[9px] flex-shrink-0 ml-1">{file.size}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Box */}
              {scanError && (
                <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                  <span>{scanError}</span>
                </div>
              )}

            </div>
          ) : (
            
            /* STEP 2: Extracted Dossier Review */
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center space-x-2.5 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm text-white">Extraction Complete!</h4>
                    <p className="text-stone-400 text-xs">
                      Gemini Vision parsed {files.length} photo{files.length > 1 ? 's' : ''} and generated a matching color theme.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setExtractedDossier(null)}
                  className="text-xs text-stone-400 hover:text-white underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Scan Again</span>
                </button>
              </div>

              {/* Dossier Preview Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Identity & Theme */}
                <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2.5">
                  <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider block">
                    Business Identity & Theme
                  </span>
                  
                  <div>
                    <label className="text-[10px] text-stone-500">Business / Candidate Name</label>
                    <p className="font-bold text-sm text-white">{extractedDossier.businessName || 'Unnamed'}</p>
                  </div>

                  <div>
                    <label className="text-[10px] text-stone-500">Category & Theme Palette</label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-300 text-xs font-semibold">
                        {extractedDossier.category}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-semibold">
                        {extractedDossier.theme}
                      </span>
                      {extractedDossier.accentColor && (
                        <span className="flex items-center gap-1 text-xs text-stone-400 font-mono">
                          <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: extractedDossier.accentColor }} />
                          <span>{extractedDossier.accentColor}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-stone-500">Hero Tagline</label>
                    <p className="text-xs text-stone-300 italic font-serif">"{extractedDossier.tagline}"</p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2.5">
                  <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider block">
                    Contact & Location Info
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-stone-500">Phone</label>
                      <p className="text-xs text-white">{extractedDossier.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-[10px] text-stone-500">Email</label>
                      <p className="text-xs text-white truncate">{extractedDossier.email || 'N/A'}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-stone-500">Address / Headquarters</label>
                    <p className="text-xs text-white">{extractedDossier.address || 'N/A'}</p>
                  </div>

                  <div>
                    <label className="text-[10px] text-stone-500">Authority Badge</label>
                    <p className="text-xs text-amber-400 font-medium">{extractedDossier.proofBadgeText || 'N/A'}</p>
                  </div>
                </div>

              </div>

              {/* Extracted Services / Menu Items */}
              {extractedDossier.services && extractedDossier.services.length > 0 && (
                <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                  <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider block">
                    Extracted Offerings / Platform Pillars ({extractedDossier.services.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {extractedDossier.services.map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-stone-900 border border-stone-800 text-xs">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-white">{item.title}</span>
                          {item.price && (
                            <span className="font-bold text-orange-400 ml-2 font-mono text-[11px]">{item.price}</span>
                          )}
                        </div>
                        <p className="text-stone-400 text-[11px] mt-0.5 line-clamp-2">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-stone-800 bg-stone-950 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium text-xs transition-colors"
          >
            Cancel
          </button>

          {!extractedDossier ? (
            <button
              type="button"
              onClick={handleScan}
              disabled={isScanning || isProcessingFiles || files.length === 0}
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-lg shadow-orange-600/30 flex items-center gap-2"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing with Vision AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze & Extract Website Content ({files.length} Photo{files.length === 1 ? '' : 's'})</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleApply}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2"
            >
              <span>Apply to Client Dossier & Open Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
