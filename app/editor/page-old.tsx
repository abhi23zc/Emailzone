'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/protected-route';
import Link from 'next/link';
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
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/dashboard" className="text-xl font-bold">EmailZone</Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h2 className="text-2xl font-bold mb-6">Create Campaign</h2>

            {message && (
              <div className="bg-green-50 text-green-600 p-3 rounded mb-4 text-sm">{message}</div>
            )}
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>
            )}

            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Campaign Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="Q1 Outreach Campaign"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rate Limit (emails/hour)
                    </label>
                    <input
                      type="number"
                      value={rateLimit}
                      onChange={(e) => setRateLimit(Number(e.target.value))}
                      min="1"
                      max="1000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Daily Quota
                    </label>
                    <input
                      type="number"
                      value={dailyQuota}
                      onChange={(e) => setDailyQuota(Number(e.target.value))}
                      min="1"
                      max="10000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={sendNow}
                        onChange={() => setSendNow(true)}
                        className="mr-2"
                      />
                      <span className="text-sm">Save as draft (send manually later)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={!sendNow}
                        onChange={() => setSendNow(false)}
                        className="mr-2"
                      />
                      <span className="text-sm">Schedule for later</span>
                    </label>
                    {!sendNow && (
                      <input
                        type="datetime-local"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="ml-6 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Email Template</h3>
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setMode('plain')}
                  className={`px-4 py-2 rounded-md ${mode === 'plain' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Plain Text
                </button>
                <button
                  onClick={() => setMode('rich')}
                  className={`px-4 py-2 rounded-md ${mode === 'rich' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Rich Text
                </button>
                <button
                  onClick={() => setMode('html')}
                  className={`px-4 py-2 rounded-md ${mode === 'html' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  HTML
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter email subject"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {mode === 'plain' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Body
                      </label>
                      <div className="mb-2 flex gap-2">
                        <button
                          onClick={() => insertVariable('name')}
                          className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
                        >
                          + Name
                        </button>
                        <button
                          onClick={() => insertVariable('email')}
                          className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
                        >
                          + Email
                        </button>
                        <button
                          onClick={() => insertVariable('company')}
                          className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
                        >
                          + Company
                        </button>
                      </div>
                      <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={12}
                        placeholder="Hi {{name}},&#10;&#10;I noticed you work at {{company}}..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      />
                    </div>
                  </>
                )}

                {mode === 'rich' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Body
                      </label>
                      <div className="mb-2 flex gap-2 flex-wrap">
                        <button
                          onClick={() => editor?.chain().focus().toggleBold().run()}
                          className={`px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 ${editor?.isActive('bold') ? 'bg-gray-200' : 'bg-white'}`}
                        >
                          Bold
                        </button>
                        <button
                          onClick={() => editor?.chain().focus().toggleItalic().run()}
                          className={`px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 ${editor?.isActive('italic') ? 'bg-gray-200' : 'bg-white'}`}
                        >
                          Italic
                        </button>
                        <button
                          onClick={() => editor?.chain().focus().toggleBulletList().run()}
                          className={`px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 ${editor?.isActive('bulletList') ? 'bg-gray-200' : 'bg-white'}`}
                        >
                          Bullet List
                        </button>
                        <div className="border-l border-gray-300 mx-1"></div>
                        <button
                          onClick={() => insertVariable('name')}
                          className="px-3 py-1 text-sm bg-blue-50 border border-blue-300 rounded hover:bg-blue-100"
                        >
                          + Name
                        </button>
                        <button
                          onClick={() => insertVariable('email')}
                          className="px-3 py-1 text-sm bg-blue-50 border border-blue-300 rounded hover:bg-blue-100"
                        >
                          + Email
                        </button>
                        <button
                          onClick={() => insertVariable('company')}
                          className="px-3 py-1 text-sm bg-blue-50 border border-blue-300 rounded hover:bg-blue-100"
                        >
                          + Company
                        </button>
                      </div>
                      <div className="border border-gray-300 rounded-md">
                        <EditorContent 
                          editor={editor} 
                          className="prose max-w-none p-3 min-h-[300px] focus:outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                {mode === 'html' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        HTML Code
                      </label>
                      <div className="mb-2 flex gap-2">
                        <button
                          onClick={() => insertVariable('name')}
                          className="px-3 py-1 text-sm bg-blue-50 border border-blue-300 rounded hover:bg-blue-100"
                        >
                          + Name
                        </button>
                        <button
                          onClick={() => insertVariable('email')}
                          className="px-3 py-1 text-sm bg-blue-50 border border-blue-300 rounded hover:bg-blue-100"
                        >
                          + Email
                        </button>
                        <button
                          onClick={() => insertVariable('company')}
                          className="px-3 py-1 text-sm bg-blue-50 border border-blue-300 rounded hover:bg-blue-100"
                        >
                          + Company
                        </button>
                      </div>
                      <textarea
                        value={htmlCode}
                        onChange={(e) => setHtmlCode(e.target.value)}
                        rows={12}
                        placeholder="<p>Hi {{name}},</p>"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Preview</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Sample data for preview:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Name"
                    value={previewData.name}
                    onChange={(e) => setPreviewData({ ...previewData, name: e.target.value })}
                    className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Email"
                    value={previewData.email}
                    onChange={(e) => setPreviewData({ ...previewData, email: e.target.value })}
                    className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Company"
                    value={previewData.company}
                    onChange={(e) => setPreviewData({ ...previewData, company: e.target.value })}
                    className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
              </div>
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <div className="mb-3 pb-3 border-b border-gray-300">
                  <p className="text-sm text-gray-600">Subject:</p>
                  <p className="font-semibold">{subject || '(No subject)'}</p>
                </div>
                <div className={mode === 'rich' || mode === 'html' ? 'prose max-w-none text-sm' : 'whitespace-pre-wrap text-sm'}>
                  {mode === 'rich' || mode === 'html' ? (
                    <div dangerouslySetInnerHTML={{ __html: renderPreview() }} />
                  ) : (
                    renderPreview() || '(Empty body)'
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mb-6">
              <Link
                href="/campaigns"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                onClick={handleSaveCampaign}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Campaign'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
