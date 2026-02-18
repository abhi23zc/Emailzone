'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/protected-route';
import Navbar from '@/components/navbar';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  stats: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
  };
  createdAt: string;
}

export default function CampaignsPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadCampaigns();
  }, [user]);

  const loadCampaigns = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/campaigns', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (campaignId: string) => {
    setDuplicating(campaignId);
    try {
      const token = await user!.getIdToken();
      const res = await fetch(`/api/campaigns/${campaignId}/duplicate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Failed to duplicate campaign');
      }

      await loadCampaigns();
    } catch (err) {
      console.error('Failed to duplicate:', err);
      alert('Failed to duplicate campaign');
    } finally {
      setDuplicating(null);
    }
  };

  const handleDelete = async (campaignId: string, campaignName: string) => {
    if (!confirm(`Are you sure you want to delete "${campaignName}"?`)) return;

    setDeleting(campaignId);
    try {
      const token = await user!.getIdToken();
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Failed to delete campaign');
      }

      await loadCampaigns();
    } catch (err) {
      console.error('Failed to delete:', err);
      alert('Failed to delete campaign');
    } finally {
      setDeleting(null);
    }
  };

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(campaign => {
    if (filter === 'all') return true;
    if (filter === 'completed') return campaign.status === 'completed';
    if (filter === 'pending') return campaign.status === 'draft' || campaign.status === 'running';
    return true;
  });

  // Sort campaigns
  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    } else {
      return sortOrder === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }
  });

  // Paginate
  const totalPages = Math.ceil(sortedCampaigns.length / itemsPerPage);
  const paginatedCampaigns = sortedCampaigns.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'scheduled': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
      case 'running': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'completed': return 'bg-green-500/10 text-green-600 dark:text-green-400';
      default: return 'bg-red-500/10 text-red-600 dark:text-red-400';
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">Campaigns</h2>
              <p className="text-muted-foreground">Manage and monitor your email campaigns</p>
            </div>
            <Link
              href="/editor"
              className="w-full md:w-auto px-6 py-2.5 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-xl font-medium hover:opacity-90 transition shadow-lg shadow-primary/25 hover:shadow-primary/40 transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Campaign
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full lg:w-auto">
              <div className="flex flex-wrap gap-2 p-1 bg-secondary/50 backdrop-blur rounded-xl w-full md:w-auto">
                <button
                  onClick={() => { setFilter('all'); setPage(1); }}
                  className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'all' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  All ({campaigns.length})
                </button>
                <button
                  onClick={() => { setFilter('completed'); setPage(1); }}
                  className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'completed' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Completed ({campaigns.filter(c => c.status === 'completed').length})
                </button>
                <button
                  onClick={() => { setFilter('pending'); setPage(1); }}
                  className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'pending' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Pending ({campaigns.filter(c => c.status === 'draft' || c.status === 'running').length})
                </button>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
                  className="flex-1 md:flex-none px-3 py-2 bg-secondary/50 backdrop-blur border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer hover:bg-secondary/70 transition"
                >
                  <option value="date">Sort by Date</option>
                  <option value="name">Sort by Name</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 bg-secondary/50 backdrop-blur rounded-xl hover:bg-secondary/70 transition text-muted-foreground hover:text-foreground"
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  <svg className={`w-5 h-5 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden border border-white/10 shadow-xl">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground">Loading...</div>
            ) : sortedCampaigns.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-muted-foreground mb-4">No campaigns yet. Create your first campaign to get started.</p>
                <Link href="/editor" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Campaign
                </Link>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Campaign
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Progress
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {paginatedCampaigns.map((campaign) => (
                        <tr key={campaign.id} className="hover:bg-muted/30 transition">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium">{campaign.name}</div>
                            <div className="text-sm text-muted-foreground">{campaign.subject}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                              {campaign.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 max-w-[120px] h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all"
                                  style={{ width: `${campaign.stats.total > 0 ? (campaign.stats.sent / campaign.stats.total) * 100 : 0}%` }}
                                />
                              </div>
                              <span className="text-muted-foreground">
                                {campaign.stats.sent} / {campaign.stats.total}
                              </span>
                            </div>
                            {campaign.stats.failed > 0 && (
                              <span className="text-red-600 dark:text-red-400 text-xs">({campaign.stats.failed} failed)</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {new Date(campaign.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleDuplicate(campaign.id)}
                              disabled={duplicating === campaign.id}
                              className="text-primary hover:underline mr-3 disabled:opacity-50"
                            >
                              {duplicating === campaign.id ? 'Duplicating...' : 'Duplicate'}
                            </button>
                            <Link
                              href={`/campaigns/${campaign.id}`}
                              className="text-primary hover:underline mr-3"
                            >
                              View
                            </Link>
                            <button
                              onClick={() => handleDelete(campaign.id, campaign.name)}
                              disabled={deleting === campaign.id}
                              className="text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
                            >
                              {deleting === campaign.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4 p-4 text-left">
                  {paginatedCampaigns.map((campaign) => (
                    <div key={campaign.id} className="p-5 border border-border/50 rounded-2xl bg-background/50 backdrop-blur-sm hover:bg-muted/30 transition shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-3 gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg truncate pr-2">{campaign.name}</h3>
                            <p className="text-sm text-muted-foreground truncate">{campaign.subject}</p>
                          </div>
                          <span className={`shrink-0 px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                            {campaign.status}
                          </span>
                        </div>

                        <div className="mb-5 bg-muted/30 p-3 rounded-xl border border-white/5">
                          <div className="flex justify-between text-xs font-medium text-muted-foreground mb-2">
                            <span>Progress</span>
                            <span className="text-foreground">{campaign.stats.sent} / {campaign.stats.total} Sent</span>
                          </div>
                          <div className="h-2.5 bg-muted rounded-full overflow-hidden w-full">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-indigo-500 transition-all duration-500 ease-out"
                              style={{ width: `${campaign.stats.total > 0 ? (campaign.stats.sent / campaign.stats.total) * 100 : 0}%` }}
                            />
                          </div>
                          {campaign.stats.failed > 0 && (
                            <p className="text-red-600 dark:text-red-400 text-xs mt-2 flex items-center gap-1 font-medium">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {campaign.stats.failed} failed delivery
                            </p>
                          )}
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-border/50">
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {new Date(campaign.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex gap-3 text-sm font-medium">
                            <button
                              onClick={() => handleDuplicate(campaign.id)}
                              disabled={duplicating === campaign.id}
                              className="text-primary hover:text-indigo-500 disabled:opacity-50 transition-colors"
                            >
                              {duplicating === campaign.id ? 'Copying...' : 'Copy'}
                            </button>
                            <Link
                              href={`/campaigns/${campaign.id}`}
                              className="text-primary hover:text-indigo-500 transition-colors"
                            >
                              View
                            </Link>
                            <button
                              onClick={() => handleDelete(campaign.id, campaign.name)}
                              disabled={deleting === campaign.id}
                              className="text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * itemsPerPage) + 1} to {Math.min(page * itemsPerPage, sortedCampaigns.length)} of {sortedCampaigns.length} campaigns
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-lg hover:bg-accent transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-2 rounded-lg transition ${p === page ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border rounded-lg hover:bg-accent transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
