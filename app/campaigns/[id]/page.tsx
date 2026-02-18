'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/protected-route';
import Navbar from '@/components/navbar';
import { Card } from '@/components/card';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  body: string;
  status: string;
  stats: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
  };
  createdAt: string;
}

interface Log {
  id: string;
  recipientEmail: string;
  status: string;
  sentAt?: string;
  failedAt?: string;
  error?: string;
}

export default function CampaignDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const campaignId = params.id as string;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadCampaign();
    const interval = setInterval(loadCampaign, 5000);
    return () => clearInterval(interval);
  }, [user, campaignId]);

  const loadCampaign = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCampaign(data.campaign);
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to load campaign:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!confirm('Are you sure you want to send this campaign?')) return;

    setSending(true);
    setError('');
    setMessage('');

    try {
      const token = await user!.getIdToken();
      const res = await fetch(`/api/campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send campaign');
      }

      setMessage('Campaign started! Emails are being sent...');
      loadCampaign();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'running': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'completed': return 'bg-green-500/10 text-green-600 dark:text-green-400';
      default: return 'bg-red-500/10 text-red-600 dark:text-red-400';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!campaign) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <p className="text-muted-foreground">Campaign not found</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <Link href="/campaigns" className="text-primary hover:underline text-sm mb-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Campaigns
              </Link>
              <h2 className="text-3xl font-bold mt-2">{campaign.name}</h2>
            </div>
            {campaign.status === 'draft' && (
              <button
                onClick={handleSend}
                disabled={sending}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                {sending ? 'Starting...' : 'Send Campaign'}
              </button>
            )}
          </div>

          {message && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 p-3 rounded-lg mb-6 text-sm flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {message}
            </div>
          )}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-6 text-sm flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <p className="text-sm text-muted-foreground mb-1">Total</p>
              <p className="text-3xl font-bold">{campaign.stats.total}</p>
            </Card>
            <Card>
              <p className="text-sm text-muted-foreground mb-1">Sent</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{campaign.stats.sent}</p>
            </Card>
            <Card>
              <p className="text-sm text-muted-foreground mb-1">Failed</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">{campaign.stats.failed}</p>
            </Card>
            <Card>
              <p className="text-sm text-muted-foreground mb-1">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{campaign.stats.pending}</p>
            </Card>
          </div>

          <Card className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Campaign Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start">
                <span className="font-medium w-32">Subject:</span>
                <span className="text-muted-foreground flex-1">{campaign.subject}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium w-32">Status:</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(campaign.status)}`}>
                  {campaign.status}
                </span>
              </div>
              <div className="flex items-start">
                <span className="font-medium w-32">Created:</span>
                <span className="text-muted-foreground">{new Date(campaign.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </Card>

          <Card className="p-0">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Email Logs</h3>
            </div>
            {logs.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">No logs yet</div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Recipient
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Error
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-muted/30 transition">
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {log.recipientEmail}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 text-xs rounded-full font-semibold ${log.status === 'sent' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
                              }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {log.sentAt ? new Date(log.sentAt).toLocaleString() :
                              log.failedAt ? new Date(log.failedAt).toLocaleString() : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-red-600 dark:text-red-400">
                            {log.error || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-4 p-4">
                  {logs.map((log) => (
                    <div key={log.id} className="p-4 border border-border/50 rounded-xl bg-background/50">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-sm break-all">{log.recipientEmail}</span>
                        <span className={`shrink-0 px-2.5 py-0.5 text-xs rounded-full font-semibold ${log.status === 'sent' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
                          }`}>
                          {log.status}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {log.sentAt ? new Date(log.sentAt).toLocaleString() :
                          log.failedAt ? new Date(log.failedAt).toLocaleString() : '-'}
                      </div>
                      {log.error && (
                        <div className="text-xs text-red-600 dark:text-red-400 mt-2 bg-red-500/5 p-2 rounded border border-red-500/10">
                          Error: {log.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}
