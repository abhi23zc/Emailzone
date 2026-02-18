'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/protected-route';
import Navbar from '@/components/navbar';
import { Card } from '@/components/card';
import { useAuth } from '@/lib/auth-context';
import Papa from 'papaparse';

interface Recipient {
  id: string;
  email: string;
  customFields: Record<string, string>;
  createdAt: string;
}

export default function RecipientsPage() {
  const { user } = useAuth();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCsvUpload, setShowCsvUpload] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadRecipients();
  }, [user]);

  const loadRecipients = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/recipients', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRecipients(data.recipients || []);
    } catch (err) {
      console.error('Failed to load recipients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddField = () => {
    if (newFieldKey && newFieldValue) {
      setCustomFields({ ...customFields, [newFieldKey]: newFieldValue });
      setNewFieldKey('');
      setNewFieldValue('');
    }
  };

  const handleRemoveField = (key: string) => {
    const updated = { ...customFields };
    delete updated[key];
    setCustomFields(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const token = await user!.getIdToken();

      if (editingId) {
        // Update existing recipient
        const res = await fetch(`/api/recipients/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email, customFields }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to update recipient');
        }

        setMessage('Recipient updated successfully');
      } else {
        // Add new recipient
        const res = await fetch('/api/recipients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email, customFields }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to add recipient');
        }

        setMessage('Recipient added successfully');
      }

      setEmail('');
      setCustomFields({});
      setEditingId(null);
      setShowForm(false);
      loadRecipients();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (recipient: Recipient) => {
    setEditingId(recipient.id);
    setEmail(recipient.email);
    setCustomFields(recipient.customFields);
    setShowForm(true);
    setShowCsvUpload(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEmail('');
    setCustomFields({});
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recipient?')) return;

    try {
      const token = await user!.getIdToken();
      const res = await fetch(`/api/recipients/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Failed to delete recipient');
      }

      loadRecipients();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results: any) => {
        setCsvData(results.data);
        setCsvHeaders(results.meta.fields || []);
        setColumnMapping({});
      },
      error: (error: any) => {
        setError('Failed to parse CSV: ' + error.message);
      },
    });
  };

  const handleBulkImport = async () => {
    if (!columnMapping.email) {
      setError('Please map the email column');
      return;
    }

    setUploading(true);
    setError('');
    setMessage('');

    try {
      const mappedRecipients = csvData
        .filter((row) => row[columnMapping.email])
        .map((row) => {
          const customFields: Record<string, string> = {};
          Object.entries(columnMapping).forEach(([field, csvColumn]) => {
            if (field !== 'email' && csvColumn && row[csvColumn]) {
              customFields[field] = row[csvColumn];
            }
          });

          return {
            email: row[columnMapping.email],
            customFields,
          };
        });

      const token = await user!.getIdToken();
      const res = await fetch('/api/recipients/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recipients: mappedRecipients }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to import recipients');
      }

      const data = await res.json();
      setMessage(`Successfully imported ${data.count} recipients`);
      setCsvData([]);
      setCsvHeaders([]);
      setColumnMapping({});
      setShowCsvUpload(false);
      loadRecipients();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">Recipients</h2>
              <p className="text-muted-foreground">Manage your email contact list</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <button
                onClick={() => {
                  setShowCsvUpload(!showCsvUpload);
                  setShowForm(false);
                }}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${showCsvUpload ? 'bg-secondary text-foreground' : 'glass hover:bg-white/20'}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {showCsvUpload ? 'Cancel' : 'Upload CSV'}
              </button>
              <button
                onClick={() => {
                  setShowForm(!showForm);
                  setShowCsvUpload(false);
                  if (showForm) handleCancelEdit();
                }}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${showForm ? 'bg-secondary text-foreground' : 'bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5'}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {showForm ? 'Cancel' : 'Add Recipient'}
              </button>
            </div>
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

          {showCsvUpload && (
            <div className="glass-card p-6 rounded-2xl mb-8 animate-slide-up border border-white/10">
              <h3 className="text-lg font-semibold mb-6">Upload CSV File</h3>

              {csvHeaders.length === 0 ? (
                <label className="block cursor-pointer group">
                  <div className="border-2 border-dashed border-border group-hover:border-primary/50 rounded-2xl p-12 text-center transition-all duration-300 bg-background/30 group-hover:bg-background/50">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-foreground/80 font-medium mb-1 group-hover:text-primary transition-colors">Click to upload or drag and drop</p>
                    <p className="text-sm text-muted-foreground">CSV files only</p>
                  </div>
                </label>
              ) : (
                <div className="animate-fade-in">
                  <p className="text-sm text-muted-foreground mb-4">
                    Found {csvData.length} rows. Map CSV columns to recipient fields:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div>
                      <label className="block text-sm font-medium mb-2 ml-1 text-foreground/80">
                        Email Column <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={columnMapping.email || ''}
                        onChange={(e) => setColumnMapping({ ...columnMapping, email: e.target.value })}
                        className="w-full px-4 py-2.5 bg-background/50 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition cursor-pointer"
                      >
                        <option value="">Select column...</option>
                        {csvHeaders.map((header) => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 ml-1 text-foreground/80">
                        Name Column (optional)
                      </label>
                      <select
                        value={columnMapping.name || ''}
                        onChange={(e) => setColumnMapping({ ...columnMapping, name: e.target.value })}
                        className="w-full px-4 py-2.5 bg-background/50 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition cursor-pointer"
                      >
                        <option value="">Select column...</option>
                        {csvHeaders.map((header) => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 ml-1 text-foreground/80">
                        Company Column (optional)
                      </label>
                      <select
                        value={columnMapping.company || ''}
                        onChange={(e) => setColumnMapping({ ...columnMapping, company: e.target.value })}
                        className="w-full px-4 py-2.5 bg-background/50 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition cursor-pointer"
                      >
                        <option value="">Select column...</option>
                        {csvHeaders.map((header) => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={handleBulkImport}
                      disabled={uploading || !columnMapping.email}
                      className="flex-1 py-3 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-xl font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none"
                    >
                      {uploading ? 'Importing...' : 'Import Recipients'}
                    </button>
                    <button
                      onClick={() => {
                        setCsvData([]);
                        setCsvHeaders([]);
                        setColumnMapping({});
                      }}
                      className="px-8 py-3 border border-input bg-background/50 rounded-xl font-medium hover:bg-accent/50 transition"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {showForm && (
            <div className="glass-card p-6 rounded-2xl mb-8 animate-slide-up border border-white/10">
              <h3 className="text-lg font-semibold mb-6">{editingId ? 'Edit Recipient' : 'Add New Recipient'}</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 ml-1 text-foreground/80">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background/50 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                    placeholder="recipient@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3 ml-1 text-foreground/80">
                    Custom Fields
                  </label>
                  {Object.entries(customFields).map(([key, value]) => (
                    <div key={key} className="flex gap-3 mb-3">
                      <div className="flex-1 px-4 py-2.5 bg-muted/50 border border-border/50 rounded-xl text-sm flex items-center">
                        <span className="font-medium mr-2">{key}:</span> {value}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveField(key)}
                        className="px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-xl transition border border-transparent hover:border-red-500/20"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <div className="flex flex-col sm:flex-row gap-3 mt-4 p-4 bg-muted/30 rounded-xl border border-white/5">
                    <input
                      type="text"
                      placeholder="Field name (e.g., name)"
                      value={newFieldKey}
                      onChange={(e) => setNewFieldKey(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-background/50 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Field value"
                      value={newFieldValue}
                      onChange={(e) => setNewFieldValue(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-background/50 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddField}
                      className="px-6 py-2.5 border border-input bg-background/50 rounded-xl font-medium hover:bg-accent/50 transition text-sm whitespace-nowrap"
                    >
                      Add Field
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-xl font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5"
                  >
                    {editingId ? 'Update Recipient' : 'Add Recipient'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-8 py-3 border border-input bg-background/50 rounded-xl font-medium hover:bg-accent/50 transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          <div className="glass-card rounded-2xl overflow-hidden border border-white/10 shadow-xl">
            {loading ? (
              <div className="p-16 text-center text-muted-foreground flex flex-col items-center gap-4">
                <div className="w-8 h-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
                Loading recipients...
              </div>
            ) : recipients.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                  <svg className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">No recipients yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Add your first recipient manually or upload a CSV file to get started.</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition shadow-lg shadow-primary/20"
                >
                  Add Recipient
                </button>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-border/50">
                    <thead className="bg-muted/50 backdrop-blur-sm">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Custom Fields
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Added
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 bg-transparent">
                      {recipients.map((recipient) => (
                        <tr key={recipient.id} className="hover:bg-muted/40 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {recipient.email}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {Object.keys(recipient.customFields).length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(recipient.customFields).map(([key, value]) => (
                                  <span key={key} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                    {key}: {value}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic">None</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {new Date(recipient.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEdit(recipient)}
                              className="text-primary hover:text-indigo-500 hover:underline mr-4 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(recipient.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-700 hover:underline transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4 p-4 text-left">
                  {recipients.map((recipient) => (
                    <div key={recipient.id} className="p-5 border border-border/50 rounded-2xl bg-background/50 backdrop-blur-sm hover:bg-muted/30 transition shadow-sm relative overflow-hidden group">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-semibold text-base break-all">{recipient.email}</div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Added {new Date(recipient.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {Object.keys(recipient.customFields).length > 0 && (
                        <div className="mb-4 bg-muted/30 p-3 rounded-xl border border-white/5">
                          <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Custom Fields</div>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(recipient.customFields).map(([key, value]) => (
                              <span key={key} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                <span className="opacity-70 mr-1">{key}:</span> {value}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end gap-3 pt-3 border-t border-border/50">
                        <button
                          onClick={() => handleEdit(recipient)}
                          className="text-primary hover:text-indigo-500 font-medium text-sm transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(recipient.id)}
                          className="text-red-600 hover:text-red-700 font-medium text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
