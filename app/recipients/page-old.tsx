'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/protected-route';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
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
      setEmail('');
      setCustomFields({});
      setShowForm(false);
      loadRecipients();
    } catch (err: any) {
      setError(err.message);
    }
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
      complete: (results) => {
        setCsvData(results.data);
        setCsvHeaders(results.meta.fields || []);
        setColumnMapping({});
      },
      error: (error) => {
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Recipients</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowCsvUpload(!showCsvUpload);
                    setShowForm(false);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  {showCsvUpload ? 'Cancel' : 'Upload CSV'}
                </button>
                <button
                  onClick={() => {
                    setShowForm(!showForm);
                    setShowCsvUpload(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {showForm ? 'Cancel' : 'Add Recipient'}
                </button>
              </div>
            </div>

            {message && (
              <div className="bg-green-50 text-green-600 p-3 rounded mb-4 text-sm">{message}</div>
            )}
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>
            )}

            {showCsvUpload && (
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Upload CSV File</h3>
                
                {csvHeaders.length === 0 ? (
                  <div>
                    <label className="block">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 cursor-pointer">
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <p className="text-gray-600">Click to upload or drag and drop</p>
                        <p className="text-sm text-gray-500 mt-1">CSV files only</p>
                      </div>
                    </label>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      Found {csvData.length} rows. Map CSV columns to recipient fields:
                    </p>
                    
                    <div className="space-y-3 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Column *
                        </label>
                        <select
                          value={columnMapping.email || ''}
                          onChange={(e) => setColumnMapping({ ...columnMapping, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name Column (optional)
                        </label>
                        <select
                          value={columnMapping.name || ''}
                          onChange={(e) => setColumnMapping({ ...columnMapping, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company Column (optional)
                        </label>
                        <select
                          value={columnMapping.company || ''}
                          onChange={(e) => setColumnMapping({ ...columnMapping, company: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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

                    <div className="flex gap-2">
                      <button
                        onClick={handleBulkImport}
                        disabled={uploading || !columnMapping.email}
                        className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {uploading ? 'Importing...' : 'Import Recipients'}
                      </button>
                      <button
                        onClick={() => {
                          setCsvData([]);
                          setCsvHeaders([]);
                          setColumnMapping({});
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {showForm && (
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Add New Recipient</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Fields
                    </label>
                    {Object.entries(customFields).map(([key, value]) => (
                      <div key={key} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={key}
                          disabled
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                        />
                        <input
                          type="text"
                          value={value}
                          disabled
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveField(key)}
                          className="px-3 py-2 text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Field name (e.g., name)"
                        value={newFieldKey}
                        onChange={(e) => setNewFieldKey(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Field value"
                        value={newFieldValue}
                        onChange={(e) => setNewFieldValue(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddField}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                      >
                        Add Field
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add Recipient
                  </button>
                </form>
              </div>
            )}

            <div className="bg-white shadow rounded-lg overflow-hidden">
              {loading ? (
                <div className="p-6 text-center">Loading...</div>
              ) : recipients.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No recipients yet. Add your first recipient to get started.
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Custom Fields
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Added
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recipients.map((recipient) => (
                      <tr key={recipient.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {recipient.email}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {Object.keys(recipient.customFields).length > 0 ? (
                            <div className="space-y-1">
                              {Object.entries(recipient.customFields).map(([key, value]) => (
                                <div key={key}>
                                  <span className="font-medium">{key}:</span> {value}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">None</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(recipient.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDelete(recipient.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
