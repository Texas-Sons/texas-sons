const fs = require('fs');
let content = fs.readFileSync('src/components/ClientIntake/ClientIntakeView.tsx', 'utf8');

// 1. Add import for submissions
if (!content.includes('IntakeSubmission')) {
  content = content.replace(
    /import \{ listIntakes, saveIntake, cachedIntakes \} from '\.\.\/\.\.\/store';/,
    `import { listIntakes, saveIntake, cachedIntakes } from '../../store';\nimport { listSubmissions, IntakeSubmission, markSubmissionReviewed } from '../../store/submissions';`
  );
}

// 2. Add State variables
if (!content.includes('const [submissions, setSubmissions]')) {
  content = content.replace(
    /const \[clients, setClients\] = useState<ClientIntake\[\]>\(\(\) => \{/,
    `const [submissions, setSubmissions] = useState<IntakeSubmission[]>([]);\n  const [shareLinkLoading, setShareLinkLoading] = useState(false);\n  const [reviewSubmission, setReviewSubmission] = useState<IntakeSubmission | null>(null);\n\n  const [clients, setClients] = useState<ClientIntake[]>(() => {`
  );
}

// 3. Add useEffect to fetch submissions
if (!content.includes('const storedSubmissions = await listSubmissions()')) {
  content = content.replace(
    /const stored = await listIntakes\(\);\s*if \(stored\.length\) setClients\(stored\);\s*\}\)\(\);/,
    `const stored = await listIntakes();\n      if (stored.length) setClients(stored);\n      \n      const storedSubmissions = await listSubmissions();\n      setSubmissions(storedSubmissions);\n    })();`
  );
}

// 4. Update the ShareModal rendering
const shareModalStart = content.indexOf('{/* MODAL 2: Share Questionnaire');
const shareModalEndRegex = /\s*\{\/\* ========================================================================= \*\/\}\s*\{\/\* MODAL 3: /;
const shareModalEndMatch = content.match(shareModalEndRegex);
const shareModalEnd = shareModalEndMatch ? shareModalEndMatch.index : content.lastIndexOf('</div>\n    </div>\n  );');

if (shareModalStart !== -1 && shareModalEnd !== -1) {
  const newShareModal = `{/* MODAL 2: Share Questionnaire & Client Onboarding Templates */}
      {shareModalClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-950">
              <div>
                <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-[#C5A059]" />
                  Client Portal: {shareModalClient.businessName}
                </h3>
                <p className="text-xs text-stone-400">
                  Manage their intake link, send invites, and review submissions.
                </p>
              </div>
              <button 
                onClick={() => { setShareModalClient(null); setReviewSubmission(null); }}
                className="p-1.5 text-stone-400 hover:text-stone-100 rounded-lg hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-8 text-xs">
              
              {/* Intake Link Generation */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white border-b border-stone-800 pb-2">1. Generate Intake Link</h4>
                
                <div className="flex items-center gap-4">
                  {shareModalClient.share_token && !shareModalClient.share_token_revoked ? (
                    <div className="flex-1 bg-stone-950 border border-emerald-900/50 rounded-lg p-3 flex items-center justify-between">
                      <span className="text-emerald-400 font-mono select-all truncate">
                        {window.location.origin}/intake/{shareModalClient.share_token}
                      </span>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleCopyText(window.location.origin + '/intake/' + shareModalClient.share_token, 'link')}
                          className="px-3 py-1.5 rounded bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-300 flex items-center gap-1.5 transition-colors"
                        >
                          {copiedType === 'link' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          Copy Link
                        </button>
                        <button
                          onClick={async () => {
                            if(!confirm('Revoke this link? The client will no longer be able to submit assets.')) return;
                            setShareLinkLoading(true);
                            try {
                              const res = await apiFetch('/api/intake-link', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ intakeId: shareModalClient.id, revoke: true })
                              });
                              if (res.ok) {
                                const updated = { ...shareModalClient, share_token_revoked: true };
                                setShareModalClient(updated);
                                setClients(clients.map(c => c.id === updated.id ? updated : c));
                              }
                            } catch(err) {
                              alert('Failed to revoke link');
                            }
                            setShareLinkLoading(false);
                          }}
                          disabled={shareLinkLoading}
                          className="px-3 py-1.5 rounded bg-red-900/20 hover:bg-red-900/40 text-red-400 transition-colors"
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={async () => {
                        setShareLinkLoading(true);
                        try {
                          const res = await apiFetch('/api/intake-link', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ intakeId: shareModalClient.id })
                          });
                          if (!res.ok) throw new Error('Failed');
                          const data = await res.json();
                          const updated = { ...shareModalClient, share_token: data.token, share_token_revoked: false };
                          setShareModalClient(updated);
                          setClients(clients.map(c => c.id === updated.id ? updated : c));
                        } catch(err) {
                          alert('Failed to generate link');
                        }
                        setShareLinkLoading(false);
                      }}
                      disabled={shareLinkLoading}
                      className="px-4 py-2 rounded-lg bg-[#C5A059] hover:bg-[#d4b06a] text-stone-950 font-bold flex items-center gap-2 transition-colors"
                    >
                      <Sparkles className="w-4 h-4" />
                      {shareModalClient.share_token_revoked ? 'Generate New Link' : 'Generate Secure Link'}
                    </button>
                  )}
                </div>
              </div>

              {/* Communication Templates */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white border-b border-stone-800 pb-2">2. Send Invitation</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-300 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#C5A059]" /> Email Template
                      </span>
                      <button
                        onClick={() => {
                          const link = shareModalClient.share_token ? window.location.origin + '/intake/' + shareModalClient.share_token : '[LINK NOT GENERATED YET]';
                          const emailText = "Subject: Welcome to TX Sons — Let's build " + shareModalClient.businessName + "\n\nHi " + (shareModalClient.clientContact || 'there') + ",\n\nWe are thrilled to kick off your new digital platform! To get started, please take a few minutes to upload your logo, photos, and basic info to your secure intake portal:\n\n" + link + "\n\nOnce received, we'll start building your site right away. Let us know if you have any questions!\n\nBest regards,\nMorgan\nTX Sons Delivery Engine";
                          handleCopyText(emailText, 'email');
                        }}
                        className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center gap-1 transition-colors"
                      >
                        {copiedType === 'email' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        Copy
                      </button>
                    </div>
                    <div className="p-3 rounded-lg bg-stone-950 border border-stone-800 text-stone-400 font-mono text-[10px] leading-relaxed whitespace-pre-wrap">
                      Subject: Welcome to TX Sons — Let's build {shareModalClient.businessName}...
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-300 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-blue-400" /> SMS Template
                      </span>
                      <button
                        onClick={() => {
                          const link = shareModalClient.share_token ? window.location.origin + '/intake/' + shareModalClient.share_token : '[LINK NOT GENERATED YET]';
                          const smsText = "Hey " + (shareModalClient.clientContact || 'there') + "! This is Morgan with TX Sons. We're ready to start building " + shareModalClient.businessName + ". Please upload your logo and photos to your secure portal here: " + link;
                          handleCopyText(smsText, 'sms');
                        }}
                        className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center gap-1 transition-colors"
                      >
                        {copiedType === 'sms' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        Copy
                      </button>
                    </div>
                    <div className="p-3 rounded-lg bg-stone-950 border border-stone-800 text-stone-400 font-mono text-[10px] leading-relaxed whitespace-pre-wrap">
                      Hey {shareModalClient.clientContact || 'there'}! This is Morgan with TX Sons...
                    </div>
                  </div>
                </div>
              </div>

              {/* Submissions Review */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white border-b border-stone-800 pb-2 flex items-center justify-between">
                  3. Client Submissions
                  <span className="bg-stone-800 text-stone-300 px-2 py-0.5 rounded-full text-[10px]">
                    {submissions.filter(s => s.intake_id === shareModalClient.id).length} received
                  </span>
                </h4>

                {reviewSubmission ? (
                  <div className="bg-stone-950 border border-stone-800 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="text-sm font-bold text-white">Review Submission</h5>
                      <button onClick={() => setReviewSubmission(null)} className="text-stone-400 hover:text-white">Back to List</button>
                    </div>
                    
                    <div className="space-y-4">
                      {reviewSubmission.payload.logoBase64 && (
                        <div>
                          <p className="text-stone-400 mb-1">Logo:</p>
                          <img src={reviewSubmission.payload.logoBase64} alt="Logo" className="h-16 object-contain bg-stone-900 p-1 rounded" />
                        </div>
                      )}
                      
                      {reviewSubmission.payload.photos && reviewSubmission.payload.photos.length > 0 && (
                        <div>
                          <p className="text-stone-400 mb-1">Photos ({reviewSubmission.payload.photos.length}):</p>
                          <div className="flex gap-2 overflow-x-auto">
                            {reviewSubmission.payload.photos.map((p: string, i: number) => (
                              <img key={i} src={p} alt="Upload" className="h-20 object-cover rounded border border-stone-800" />
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-stone-300">
                        <div><strong>Tagline:</strong> {reviewSubmission.payload.tagline || '-'}</div>
                        <div><strong>Hours:</strong> {reviewSubmission.payload.hours || '-'}</div>
                        <div><strong>Email:</strong> {reviewSubmission.payload.email || '-'}</div>
                        <div><strong>Phone:</strong> {reviewSubmission.payload.phone || '-'}</div>
                        <div className="col-span-2"><strong>Address:</strong> {reviewSubmission.payload.address || '-'}</div>
                        <div className="col-span-2"><strong>Description:</strong> {reviewSubmission.payload.description || '-'}</div>
                        <div className="col-span-2"><strong>Notes:</strong> {reviewSubmission.payload.notes || '-'}</div>
                      </div>

                      <button
                        onClick={async () => {
                          const updated = {
                            ...shareModalClient,
                            tagline: reviewSubmission.payload.tagline || shareModalClient.tagline,
                            description: reviewSubmission.payload.description || shareModalClient.description,
                            hours: reviewSubmission.payload.hours || shareModalClient.hours,
                            email: reviewSubmission.payload.email || shareModalClient.email,
                            phone: reviewSubmission.payload.phone || shareModalClient.phone,
                            address: reviewSubmission.payload.address || shareModalClient.address,
                            logoUrl: reviewSubmission.payload.logoBase64 || shareModalClient.logoUrl,
                            notes: (shareModalClient.notes ? shareModalClient.notes + '\n' : '') + (reviewSubmission.payload.notes || ''),
                            services: reviewSubmission.payload.services?.length ? reviewSubmission.payload.services : shareModalClient.services
                          };
                          
                          if (reviewSubmission.payload.photos && reviewSubmission.payload.photos.length > 0) {
                             updated.heroImage = reviewSubmission.payload.photos[0];
                          }
                          
                          try {
                            await saveIntake(updated);
                            await markSubmissionReviewed(reviewSubmission.id);
                            
                            setClients(clients.map(c => c.id === updated.id ? updated : c));
                            setShareModalClient(updated);
                            setSubmissions(submissions.map(s => s.id === reviewSubmission.id ? { ...s, reviewed: true } : s));
                            setReviewSubmission(null);
                            alert('Successfully merged into Client Record!');
                          } catch(err) {
                            alert('Failed to save intake');
                          }
                        }}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg mt-4 transition-colors"
                      >
                        Merge & Apply to Intake Record
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {submissions.filter(s => s.intake_id === shareModalClient.id).length === 0 ? (
                      <div className="p-4 text-center border border-stone-800 border-dashed rounded-lg text-stone-500">
                        No submissions yet.
                      </div>
                    ) : (
                      submissions.filter(s => s.intake_id === shareModalClient.id).map(sub => (
                        <div key={sub.id} className="flex items-center justify-between p-3 bg-stone-950 border border-stone-800 rounded-lg hover:border-stone-700 transition-colors">
                          <div>
                            <p className="font-bold text-stone-300 flex items-center gap-2">
                              {new Date(sub.created_at).toLocaleString()}
                              {sub.reviewed ? (
                                <span className="text-emerald-500 flex items-center"><CheckCircle2 className="w-3 h-3 mr-1"/> Applied</span>
                              ) : (
                                <span className="text-amber-500 flex items-center"><Clock className="w-3 h-3 mr-1"/> Pending Review</span>
                              )}
                            </p>
                            <p className="text-stone-500">
                              Includes: {sub.payload.logoBase64 ? 'Logo, ' : ''} {sub.payload.photos?.length || 0} photos
                            </p>
                          </div>
                          <button
                            onClick={() => setReviewSubmission(sub)}
                            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-white rounded text-[11px]"
                          >
                            Review
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
`;
  content = content.substring(0, shareModalStart) + newShareModal + content.substring(shareModalEnd);
}

// Add share_token type property to ClientIntake type in src/types.ts
const typesContent = fs.readFileSync('src/types.ts', 'utf8');
if (!typesContent.includes('share_token?: string;')) {
  fs.writeFileSync('src/types.ts', typesContent.replace('businessName: string;', 'businessName: string;\n  share_token?: string;\n  share_token_revoked?: boolean;'));
}

fs.writeFileSync('src/components/ClientIntake/ClientIntakeView.tsx', content);
