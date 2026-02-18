'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/protected-route';
import Navbar from '@/components/navbar';
import { Card } from '@/components/card';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

type EditorMode = 'plain' | 'rich' | 'html';

export default function CampaignEditorPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<EditorMode>('plain');
  const [campaignName, setCampaignName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [htmlCode, setHtmlCode] = useState('<p>Hi {{name}},</p><p>I noticed you work at {{company}}...</p>');
  const [rateLimit, setRateLimit] = useState(50);
  const [dailyQuota, setDailyQuota] = useState(500);
  const [sendNow, setSendNow] = useState(true);
  const [scheduleTime, setScheduleTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [previewData, setPreviewData] = useState({ name: 'John Doe', email: 'john@example.com', company: 'Acme Inc' });

  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Hi {{name}},</p><p>I noticed you work at {{company}}...</p>',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none p-4 min-h-[300px] focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-xl transition-all',
      },
    },
  });

  const insertVariable = (variable: string) => {
    if (mode === 'plain') {
      setBody(body + `{{${variable}}}`);
    } else if (mode === 'rich' && editor) {
      editor.chain().focus().insertContent(`{{${variable}}}`).run();
    } else if (mode === 'html') {
      setHtmlCode(htmlCode + `{{${variable}}}`);
    }
  };

  const renderPreview = () => {
    let preview = mode === 'plain' ? body : mode === 'html' ? htmlCode : (editor?.getHTML() || '');
    Object.entries(previewData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return preview;
  };

  const handleSaveCampaign = async () => {
    if (!campaignName || !subject) {
      setError('Campaign name and subject are required');
      return;
    }

    const finalBody = mode === 'plain' ? body : mode === 'html' ? htmlCode : (editor?.getHTML() || '');
    if (!finalBody) {
      setError('Email body is required');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const token = await user!.getIdToken();
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: campaignName,
          subject,
          body: finalBody,
          templateType: mode,
          rateLimit,
          dailyQuota,
          scheduleTime: sendNow ? undefined : scheduleTime,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save campaign');
      }

      setMessage('Campaign saved successfully!');
      setTimeout(() => router.push('/campaigns'), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">Create Campaign</h2>
            <p className="text-muted-foreground">Design your email template and configure campaign settings</p>
          </div>

          {message && (
            <div className="glass bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400 p-4 rounded-xl mb-6 text-sm flex items-center gap-3 animate-fade-in shadow-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {message}
            </div>
          )}
          {error && (
            <div className="glass bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 text-sm flex items-center gap-3 animate-fade-in shadow-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <div className="glass-card p-6 rounded-2xl mb-8 animate-slide-up border border-white/10 shadow-lg" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Campaign Settings
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 ml-1 text-foreground/80">
                  Campaign Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Q1 Outreach Campaign"
                  className="w-full px-4 py-2.5 bg-background/50 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 ml-1 text-foreground/80">
                    Rate Limit (emails/hour)
                  </label>
                  <input
                    type="number"
                    value={rateLimit}
                    onChange={(e) => setRateLimit(Number(e.target.value))}
                    min="1"
                    max="1000"
                    className="w-full px-4 py-2.5 bg-background/50 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 ml-1 text-foreground/80">
                    Daily Quota
                  </label>
                  <input
                    type="number"
                    value={dailyQuota}
                    onChange={(e) => setDailyQuota(Number(e.target.value))}
                    min="1"
                    max="10000"
                    className="w-full px-4 py-2.5 bg-background/50 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 ml-1 text-foreground/80">
                  Schedule
                </label>
                <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-white/5">
                  <label className="flex items-center cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        type="radio"
                        checked={sendNow}
                        onChange={() => setSendNow(true)}
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 border-2 border-muted-foreground rounded-full transition peer-checked:border-primary flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-primary rounded-full opacity-0 peer-checked:opacity-100 transition"></div>
                      </div>
                    </div>
                    <span className="ml-3 text-sm font-medium group-hover:text-primary transition-colors">Save as draft (send manually later)</span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        type="radio"
                        checked={!sendNow}
                        onChange={() => setSendNow(false)}
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 border-2 border-muted-foreground rounded-full transition peer-checked:border-primary flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-primary rounded-full opacity-0 peer-checked:opacity-100 transition"></div>
                      </div>
                    </div>
                    <span className="ml-3 text-sm font-medium group-hover:text-primary transition-colors">Schedule for later</span>
                  </label>
                  {!sendNow && (
                    <div className="pl-8 animate-fade-in">
                      <input
                        type="datetime-local"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full md:w-auto px-4 py-2 bg-background/50 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl mb-8 animate-slide-up border border-white/10 shadow-lg" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Template
            </h3>

            <div className="flex p-1 bg-muted/50 rounded-xl mb-6 w-full sm:w-fit overflow-x-auto">
              <button
                onClick={() => setMode('plain')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${mode === 'plain' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Plain Text
              </button>
              <button
                onClick={() => setMode('rich')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${mode === 'rich' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Rich Text
              </button>
              <button
                onClick={() => setMode('html')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${mode === 'html' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                HTML
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 ml-1 text-foreground/80">
                  Subject Line <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject"
                  className="w-full px-4 py-2.5 bg-background/50 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                />
              </div>

              {mode === 'plain' && (
                <div className="animate-fade-in">
                  <label className="block text-sm font-medium mb-2 ml-1 text-foreground/80">
                    Email Body
                  </label>
                  <div className="mb-3 flex gap-2 flex-wrap">
                    <button
                      onClick={() => insertVariable('name')}
                      className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition"
                    >
                      + Name
                    </button>
                    <button
                      onClick={() => insertVariable('email')}
                      className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition"
                    >
                      + Email
                    </button>
                    <button
                      onClick={() => insertVariable('company')}
                      className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition"
                    >
                      + Company
                    </button>
                  </div>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={12}
                    placeholder="Hi {{name}},&#10;&#10;I noticed you work at {{company}}..."
                    className="w-full px-4 py-3 bg-background/50 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition font-mono text-sm resize-y"
                  />
                </div>
              )}

              {mode === 'rich' && (
                <div className="animate-fade-in">
                  <label className="block text-sm font-medium mb-2 ml-1 text-foreground/80">
                    Email Body
                  </label>
                  <div className="mb-3 flex gap-2 flex-wrap items-center">
                    <div className="flex bg-muted/30 p-1 rounded-lg border border-border/50">
                      <button
                        onClick={() => editor?.chain().focus().toggleBold().run()}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${editor?.isActive('bold') ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
                      >
                        Bold
                      </button>
                      <button
                        onClick={() => editor?.chain().focus().toggleItalic().run()}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${editor?.isActive('italic') ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
                      >
                        Italic
                      </button>
                      <button
                        onClick={() => editor?.chain().focus().toggleBulletList().run()}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${editor?.isActive('bulletList') ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
                      >
                        Bullet List
                      </button>
                    </div>
                    <div className="h-6 w-px bg-border mx-2"></div>
                    <button
                      onClick={() => insertVariable('name')}
                      className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition"
                    >
                      + Name
                    </button>
                    <button
                      onClick={() => insertVariable('email')}
                      className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition"
                    >
                      + Email
                    </button>
                    <button
                      onClick={() => insertVariable('company')}
                      className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition"
                    >
                      + Company
                    </button>
                  </div>
                  <div className="border border-input rounded-xl bg-background/30 overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                    <EditorContent
                      editor={editor}
                    />
                  </div>
                </div>
              )}

              {mode === 'html' && (
                <div className="animate-fade-in">
                  <label className="block text-sm font-medium mb-2 ml-1 text-foreground/80">
                    HTML Code
                  </label>
                  <div className="mb-3 flex gap-2 flex-wrap">
                    <button
                      onClick={() => insertVariable('name')}
                      className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition"
                    >
                      + Name
                    </button>
                    <button
                      onClick={() => insertVariable('email')}
                      className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition"
                    >
                      + Email
                    </button>
                    <button
                      onClick={() => insertVariable('company')}
                      className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition"
                    >
                      + Company
                    </button>
                  </div>
                  <textarea
                    value={htmlCode}
                    onChange={(e) => setHtmlCode(e.target.value)}
                    rows={12}
                    placeholder="<p>Hi {{name}},</p>"
                    className="w-full px-4 py-3 bg-background/50 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition font-mono text-sm resize-y"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl mb-8 animate-slide-up border border-white/10 shadow-lg" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Live Preview
            </h3>
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-3 ml-1">Sample data for preview:</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={previewData.name}
                  onChange={(e) => setPreviewData({ ...previewData, name: e.target.value })}
                  className="px-4 py-2 text-sm bg-background/50 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                />
                <input
                  type="text"
                  placeholder="Email"
                  value={previewData.email}
                  onChange={(e) => setPreviewData({ ...previewData, email: e.target.value })}
                  className="px-4 py-2 text-sm bg-background/50 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                />
                <input
                  type="text"
                  placeholder="Company"
                  value={previewData.company}
                  onChange={(e) => setPreviewData({ ...previewData, company: e.target.value })}
                  className="px-4 py-2 text-sm bg-background/50 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                />
              </div>
            </div>
            <div className="border border-input rounded-xl p-6 bg-background/80 shadow-inner min-h-[200px]">
              <div className="mb-4 pb-4 border-b border-border/50">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground font-medium w-16">Subject:</span>
                  <span className="font-semibold text-foreground">{subject || <span className="text-muted-foreground italic">(No subject)</span>}</span>
                </div>
              </div>
              <div className={mode === 'rich' || mode === 'html' ? 'prose dark:prose-invert max-w-none text-sm' : 'whitespace-pre-wrap text-sm font-inherit'}>
                {mode === 'rich' || mode === 'html' ? (
                  <div dangerouslySetInnerHTML={{ __html: renderPreview() }} />
                ) : (
                  renderPreview() || <span className="text-muted-foreground italic">(Empty body)</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pb-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <button
              onClick={() => router.push('/campaigns')}
              className="px-8 py-3 border border-input bg-background/50 rounded-xl font-medium hover:bg-accent/50 transition shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCampaign}
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-xl font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:shadow-none"
            >
              {saving ? 'Saving...' : 'Save Campaign'}
            </button>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
