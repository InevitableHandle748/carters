'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Package, MapPin, Clock, CheckCircle, Truck, XCircle, Wrench, User, Plus, ExternalLink, PackageCheck, Edit2, Trash2, X, FileText, Globe, MessageSquarePlus, Search, History } from 'lucide-react';
import { toast } from 'sonner';

export function RequestDetailClient({ id }: { id: string }) {
  const { data: session } = useSession() || {};
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [editingShipment, setEditingShipment] = useState<any>(null);
  const [showAddendumModal, setShowAddendumModal] = useState(false);
  const [addendumType, setAddendumType] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const role = (session?.user as any)?.role ?? 'REQUESTER';
  const canManage = role === 'FULFILLER' || role === 'ADMIN';
  const isAdmin = role === 'ADMIN';
  const isOwner = request?.userId === (session?.user as any)?.id;
  const isOpen = request?.status !== 'COMPLETED' && request?.status !== 'CANCELLED';

  const fetchRequest = () => {
    fetch(`/api/requests/${id}`)
      .then(r => r.json())
      .then(d => setRequest(d))
      .catch(() => toast.error('Failed to load request'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (id) fetchRequest(); }, [id]);

  const updateStatus = async (status: string) => {
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(`Status updated to ${status}`);
        fetchRequest();
      } else {
        toast.error('Failed to update status');
      }
    } catch {
      toast.error('Error updating status');
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/requests/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Request deleted successfully');
        // Redirect to requests list after a short delay
        setTimeout(() => { window.location.href = '/requests'; }, 1000);
      } else {
        toast.error(data.error || 'Failed to delete request');
        setDeleting(false);
      }
    } catch {
      toast.error('Error deleting request');
      setDeleting(false);
    }
  };

  const shippedQtyMap = useMemo(() => {
    const map: Record<string, number> = {};
    request?.shipments?.forEach((s: any) => {
      s?.items?.forEach((si: any) => {
        map[si.requestItemId] = (map[si.requestItemId] || 0) + si.quantity;
      });
    });
    return map;
  }, [request?.shipments]);

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="bg-white/60 rounded-lg h-24 animate-pulse" />)}</div>;
  if (!request) return <div className="carters-card text-center py-12"><p style={{ color: '#9CA3AF' }}>Request not found.</p></div>;

  const statusColors: Record<string, { bg: string; text: string; icon: any }> = {
    PENDING: { bg: '#FEF3C7', text: '#92400E', icon: Clock },
    APPROVED: { bg: '#DBEAFE', text: '#1E40AF', icon: CheckCircle },
    SHIPPED: { bg: '#D1FAE5', text: '#065F46', icon: Truck },
    COMPLETED: { bg: '#D1FAE5', text: '#065F46', icon: CheckCircle },
    CANCELLED: { bg: '#FEE2E2', text: '#991B1B', icon: XCircle },
  };
  const sc = statusColors?.[request?.status] ?? { bg: '#F3F4F6', text: '#374151', icon: Clock };
  const StatusIcon = sc?.icon;

  const isMultiItem = request?.type === 'NEW_STORE' || request?.type === 'REPLACEMENT';
  const hasItems = (request?.items?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/requests" className="p-2 hover:bg-white/50 rounded-md"><ArrowLeft className="w-5 h-5" style={{ color: '#6B7280' }} /></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold" style={{ color: '#171B25' }}>{request?.caseNumber}</h1>
          <p className="text-sm" style={{ color: '#6B7280' }}>{request?.type?.replace?.('_', ' ')} Request</p>
        </div>
        <span className="px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1" style={{ backgroundColor: sc.bg, color: sc.text }}>
          {StatusIcon && <StatusIcon className="w-4 h-4" />} {request?.status}
        </span>
        {isAdmin && (
          <button 
            onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(''); }} 
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-white hover:opacity-90" 
            style={{ backgroundColor: '#C0392B' }}
            title="Delete request and all associated records"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        )}
      </div>

      {/* Status Actions (for Fulfillers/Admins) */}
      {canManage && isOpen && (
        <div className="carters-card">
          <h3 className="font-bold text-sm mb-3" style={{ color: '#171B25' }}>Update Status</h3>
          <div className="flex flex-wrap gap-2">
            {request?.status === 'PENDING' && (
              <>
                <button onClick={() => updateStatus('APPROVED')} className="px-4 py-1.5 rounded-md text-sm font-medium text-white" style={{ backgroundColor: '#0067B9' }}>Approve</button>
                <button onClick={() => updateStatus('CANCELLED')} className="px-4 py-1.5 rounded-md text-sm font-medium text-white" style={{ backgroundColor: '#C0392B' }}>Reject</button>
              </>
            )}
            {request?.status === 'APPROVED' && isMultiItem && hasItems && (
              <button onClick={() => { setEditingShipment(null); setShowShipmentModal(true); }} className="px-4 py-1.5 rounded-md text-sm font-medium text-white flex items-center gap-1" style={{ backgroundColor: '#00B2A9' }}>
                <Truck className="w-4 h-4" /> Create Shipment
              </button>
            )}
            {request?.status === 'APPROVED' && (!isMultiItem || !hasItems) && (
              <button onClick={() => updateStatus('SHIPPED')} className="px-4 py-1.5 rounded-md text-sm font-medium text-white" style={{ backgroundColor: '#00B2A9' }}>Mark Shipped</button>
            )}
            {request?.status === 'SHIPPED' && isMultiItem && hasItems && (
              <>
                <button onClick={() => { setEditingShipment(null); setShowShipmentModal(true); }} className="px-4 py-1.5 rounded-md text-sm font-medium text-white flex items-center gap-1" style={{ backgroundColor: '#00B2A9' }}>
                  <Plus className="w-4 h-4" /> Add Shipment
                </button>
                <button onClick={() => updateStatus('COMPLETED')} className="px-4 py-1.5 rounded-md text-sm font-medium text-white" style={{ backgroundColor: '#2E7D32' }}>Mark Completed</button>
              </>
            )}
            {request?.status === 'SHIPPED' && (!isMultiItem || !hasItems) && (
              <button onClick={() => updateStatus('COMPLETED')} className="px-4 py-1.5 rounded-md text-sm font-medium text-white" style={{ backgroundColor: '#2E7D32' }}>Mark Completed</button>
            )}
          </div>
        </div>
      )}

      {/* Addendum / Notes Actions for requesters */}
      {isOpen && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowNotesModal(true)}
            className="flex items-center gap-1 px-4 py-1.5 rounded-md text-sm font-medium text-white"
            style={{ backgroundColor: '#0067B9' }}
          >
            <MessageSquarePlus className="w-4 h-4" /> Add Notes
          </button>
          <button
            onClick={() => { setAddendumType('STORE_CHANGE'); setShowAddendumModal(true); }}
            className="flex items-center gap-1 px-4 py-1.5 rounded-md text-sm font-medium border"
            style={{ borderColor: '#0067B9', color: '#0067B9' }}
          >
            <MapPin className="w-4 h-4" /> Change Store
          </button>
          <button
            onClick={() => { setAddendumType('NOTE'); setShowAddendumModal(true); }}
            className="flex items-center gap-1 px-4 py-1.5 rounded-md text-sm font-medium border"
            style={{ borderColor: '#00B2A9', color: '#00B2A9' }}
          >
            <FileText className="w-4 h-4" /> Add Addendum
          </button>
        </div>
      )}

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="carters-card">
          <h3 className="font-bold mb-3" style={{ color: '#171B25' }}><User className="inline w-4 h-4 mr-1" /> Request Info</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span style={{ color: '#6B7280' }}>Requester</span><span className="font-medium">{request?.user?.name ?? request?.user?.email}</span></div>
            <div className="flex justify-between"><span style={{ color: '#6B7280' }}>Priority</span><span className={`font-medium ${request?.priority === 'URGENT' ? 'text-red-600' : ''}`}>{request?.priority}</span></div>
            <div className="flex justify-between"><span style={{ color: '#6B7280' }}>Install Requested</span><span className="font-medium">{request?.installRequested ? 'Yes' : 'No'}</span></div>
            {request?.storeSize && <div className="flex justify-between"><span style={{ color: '#6B7280' }}>Store Size</span><span className="font-medium">{request?.storeSize}</span></div>}
            {request?.ipAddress && <div className="flex justify-between"><span style={{ color: '#6B7280' }}>IP Address</span><span className="font-medium font-mono">{request.ipAddress}</span></div>}
            <div className="flex justify-between"><span style={{ color: '#6B7280' }}>Created</span><span>{request?.createdAt ? new Date(request.createdAt).toLocaleString() : 'N/A'}</span></div>
          </div>
          {request?.notes && <div className="mt-3 p-3 rounded-md text-sm whitespace-pre-wrap" style={{ backgroundColor: '#F5F3F0' }}><strong>Notes:</strong>\n{request.notes}</div>}
          {request?.description && <div className="mt-3 p-3 rounded-md text-sm" style={{ backgroundColor: '#F5F3F0' }}><strong>Description:</strong> {request.description}</div>}
        </div>

        <div className="space-y-6">
          {request?.store && (
            <div className="carters-card">
              <h3 className="font-bold mb-3" style={{ color: '#171B25' }}><MapPin className="inline w-4 h-4 mr-1" /> Store Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span style={{ color: '#6B7280' }}>Site Number</span><span className="font-medium">{request?.store?.siteNumber}</span></div>
                <div className="flex justify-between"><span style={{ color: '#6B7280' }}>Name</span><span className="font-medium">{request?.store?.name}</span></div>
                <div className="flex justify-between"><span style={{ color: '#6B7280' }}>Address</span><span>{request?.store?.address}</span></div>
                <div className="flex justify-between"><span style={{ color: '#6B7280' }}>City</span><span>{request?.store?.city}, {request?.store?.state} {request?.store?.zip}</span></div>
                <div className="flex justify-between"><span style={{ color: '#6B7280' }}>Size</span><span className="font-medium">{request?.store?.size}</span></div>
              </div>
            </div>
          )}

          {request?.dropShipStore && (
            <div className="carters-card">
              <h3 className="font-bold mb-3" style={{ color: '#171B25' }}>
                <Truck className="inline w-4 h-4 mr-1" /> Drop Ship Destination
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span style={{ color: '#6B7280' }}>Site Number</span><span className="font-medium">{request.dropShipStore.siteNumber}</span></div>
                <div className="flex justify-between"><span style={{ color: '#6B7280' }}>Name</span><span className="font-medium">{request.dropShipStore.name}</span></div>
                <div className="flex justify-between"><span style={{ color: '#6B7280' }}>Address</span><span>{request.dropShipStore.address}, {request.dropShipStore.city}, {request.dropShipStore.state} {request.dropShipStore.zip}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Items with shipping status */}
      {hasItems && (
        <div className="carters-card">
          <h3 className="font-bold mb-3" style={{ color: '#171B25' }}><Package className="inline w-4 h-4 mr-1" /> Equipment Items ({request?.items?.length ?? 0})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#F4F6FA' }}>
                  <th className="text-left px-3 py-2 font-semibold">Item</th>
                  <th className="text-left px-3 py-2 font-semibold">SKU</th>
                  <th className="text-left px-3 py-2 font-semibold">Category</th>
                  <th className="text-center px-3 py-2 font-semibold">Qty</th>
                  <th className="text-center px-3 py-2 font-semibold">Install</th>
                  {isMultiItem && <th className="text-center px-3 py-2 font-semibold">Shipped</th>}
                  {isMultiItem && <th className="text-left px-3 py-2 font-semibold">Tracking</th>}
                </tr>
              </thead>
              <tbody>
                {request?.items?.map?.((item: any) => {
                  const shipped = shippedQtyMap[item.id] || 0;
                  const remaining = item.quantity - shipped;
                  // Find tracking numbers associated with this item
                  const itemTrackings = request?.shipments?.filter((s: any) =>
                    s?.items?.some((si: any) => si.requestItemId === item.id)
                  )?.map((s: any) => ({
                    trackingNumber: s.trackingNumber,
                    trackingUrl: s.trackingUrl,
                    carrier: s.carrier,
                    shipmentNumber: s.shipmentNumber,
                  })) ?? [];
                  return (
                    <tr key={item?.id} className="border-b" style={{ borderColor: '#E2E5EB' }}>
                      <td className="px-3 py-2 font-medium">{item?.product?.name}</td>
                      <td className="px-3 py-2 text-gray-500 font-mono text-xs">{item?.product?.sku}</td>
                      <td className="px-3 py-2 text-gray-500">{item?.product?.category}</td>
                      <td className="px-3 py-2 text-center font-medium">{item?.quantity}</td>
                      <td className="px-3 py-2 text-center">{item?.installRequested ? <Wrench className="w-4 h-4 inline" style={{ color: '#0067B9' }} /> : <span className="text-gray-400">-</span>}</td>
                      {isMultiItem && (
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            remaining <= 0 ? 'bg-green-100 text-green-700' : shipped > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {shipped}/{item.quantity}
                            {remaining <= 0 && <PackageCheck className="w-3 h-3" />}
                          </span>
                        </td>
                      )}
                      {isMultiItem && (
                        <td className="px-3 py-2">
                          {itemTrackings.length > 0 ? (
                            <div className="space-y-1">
                              {itemTrackings.map((t: any, idx: number) => (
                                <div key={idx} className="text-xs">
                                  {t.trackingUrl ? (
                                    <a href={t.trackingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1" style={{ color: '#0067B9' }}>
                                      {t.carrier && <span className="text-gray-500">{t.carrier}:</span>} {t.trackingNumber || t.shipmentNumber} <ExternalLink className="w-3 h-3" />
                                    </a>
                                  ) : (
                                    <span>{t.carrier && <span className="text-gray-500">{t.carrier}: </span>}{t.trackingNumber || t.shipmentNumber}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                }) ?? null}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Shipments Section */}
      {isMultiItem && (request?.shipments?.length ?? 0) > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold" style={{ color: '#171B25' }}>
            <Truck className="inline w-5 h-5 mr-1" /> Shipments ({request?.shipments?.length})
          </h3>
          {request?.shipments?.map?.((shipment: any) => (
            <ShipmentCard
              key={shipment.id}
              shipment={shipment}
              requestId={id}
              canManage={canManage}
              onUpdate={fetchRequest}
              onEdit={() => { setEditingShipment(shipment); setShowShipmentModal(true); }}
            />
          ))}
        </div>
      )}

      {/* Addendums Section */}
      {(request?.addendums?.length ?? 0) > 0 && (
        <div className="carters-card">
          <h3 className="font-bold mb-3" style={{ color: '#171B25' }}>
            <History className="inline w-4 h-4 mr-1" /> Addendums ({request.addendums.length})
          </h3>
          <div className="space-y-3">
            {request.addendums.map((a: any) => (
              <div key={a.id} className="p-3 rounded-md border text-sm" style={{ borderColor: '#E2E5EB' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{
                    backgroundColor: a.type === 'STORE_CHANGE' ? '#DBEAFE' : a.type === 'NOTE' ? '#FEF3C7' : '#F3F4F6',
                    color: a.type === 'STORE_CHANGE' ? '#1E40AF' : a.type === 'NOTE' ? '#92400E' : '#374151',
                  }}>{a.type.replace(/_/g, ' ')}</span>
                  <span className="text-xs" style={{ color: '#6B7280' }}>
                    {a.user?.name ?? a.user?.email} · {a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{a.description}</p>
                {a.oldValue && <p className="text-xs mt-1" style={{ color: '#6B7280' }}><strong>Previous:</strong> {a.oldValue}</p>}
                {a.newValue && <p className="text-xs mt-1" style={{ color: '#6B7280' }}><strong>Updated to:</strong> {a.newValue}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shipment Modal */}
      {showShipmentModal && (
        <ShipmentModal
          requestId={id}
          items={request?.items ?? []}
          shippedQtyMap={shippedQtyMap}
          editingShipment={editingShipment}
          onClose={() => { setShowShipmentModal(false); setEditingShipment(null); }}
          onSaved={() => { setShowShipmentModal(false); setEditingShipment(null); fetchRequest(); }}
        />
      )}

      {/* Addendum Modal */}
      {showAddendumModal && (
        <AddendumModal
          requestId={id}
          type={addendumType}
          currentStore={request?.store}
          onClose={() => setShowAddendumModal(false)}
          onSaved={() => { setShowAddendumModal(false); fetchRequest(); }}
        />
      )}

      {/* Add Notes Modal */}
      {showNotesModal && (
        <AddNotesModal
          requestId={id}
          currentNotes={request?.notes ?? ''}
          onClose={() => setShowNotesModal(false)}
          onSaved={() => { setShowNotesModal(false); fetchRequest(); }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => !deleting && setShowDeleteModal(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-red-600">Delete Request</h3>
              <button onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-3 rounded-md" style={{ backgroundColor: '#FEE2E2' }}>
                <p className="text-sm font-medium" style={{ color: '#991B1B' }}>
                  ⚠️ This action cannot be undone
                </p>
              </div>
              <p className="text-sm" style={{ color: '#374151' }}>
                You are about to permanently delete request <strong>{request?.caseNumber}</strong> and all associated records:
              </p>
              <ul className="text-sm space-y-1 ml-4" style={{ color: '#6B7280' }}>
                <li>• {request?.items?.length || 0} request item(s)</li>
                <li>• {request?.shipments?.length || 0} shipment(s)</li>
                <li>• {request?.addendums?.length || 0} addendum(s)</li>
              </ul>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#171B25' }}>
                  Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm font-mono"
                  style={{ borderColor: '#E2E5EB' }}
                  placeholder="DELETE"
                  autoFocus
                  disabled={deleting}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => setShowDeleteModal(false)} 
                  className="px-4 py-2 rounded-md text-sm"
                  style={{ color: '#6B7280' }}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting || deleteConfirmText !== 'DELETE'}
                  className="px-4 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: '#C0392B' }}
                >
                  {deleting ? 'Deleting...' : 'Delete Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Shipment Card Component
function ShipmentCard({ shipment, requestId, canManage, onUpdate, onEdit }: {
  shipment: any; requestId: string; canManage: boolean; onUpdate: () => void; onEdit: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const markDelivered = async () => {
    try {
      const res = await fetch(`/api/requests/${requestId}/shipments/${shipment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markDelivered: true }),
      });
      if (res.ok) { toast.success('Shipment marked as delivered'); onUpdate(); }
      else toast.error('Failed to update');
    } catch { toast.error('Error'); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this shipment? Items will be marked as unshipped.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/requests/${requestId}/shipments/${shipment.id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Shipment deleted'); onUpdate(); }
      else toast.error('Failed to delete');
    } catch { toast.error('Error'); }
    setDeleting(false);
  };

  return (
    <div className="carters-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm" style={{ color: '#171B25' }}>{shipment.shipmentNumber}</span>
          {shipment.deliveredAt ? (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1">
              <PackageCheck className="w-3 h-3" /> Delivered
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 flex items-center gap-1">
              <Truck className="w-3 h-3" /> In Transit
            </span>
          )}
        </div>
        {canManage && (
          <div className="flex items-center gap-1">
            <button onClick={onEdit} className="p-1.5 hover:bg-gray-100 rounded-md" title="Edit tracking">
              <Edit2 className="w-4 h-4" style={{ color: '#6B7280' }} />
            </button>
            {!shipment.deliveredAt && (
              <button onClick={markDelivered} className="p-1.5 hover:bg-green-50 rounded-md" title="Mark delivered">
                <PackageCheck className="w-4 h-4" style={{ color: '#2E7D32' }} />
              </button>
            )}
            <button onClick={handleDelete} disabled={deleting} className="p-1.5 hover:bg-red-50 rounded-md" title="Delete shipment">
              <Trash2 className="w-4 h-4" style={{ color: '#C0392B' }} />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mb-3">
        {shipment.carrier && (
          <div><span style={{ color: '#6B7280' }}>Carrier:</span> <span className="font-medium">{shipment.carrier}</span></div>
        )}
        {shipment.trackingNumber && (
          <div>
            <span style={{ color: '#6B7280' }}>Tracking:</span>{' '}
            {shipment.trackingUrl ? (
              <a href={shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="font-medium inline-flex items-center gap-1" style={{ color: '#0067B9' }}>
                {shipment.trackingNumber} <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="font-medium">{shipment.trackingNumber}</span>
            )}
          </div>
        )}
        <div><span style={{ color: '#6B7280' }}>Shipped:</span> <span className="font-medium">{shipment.shippedAt ? new Date(shipment.shippedAt).toLocaleDateString() : 'N/A'}</span></div>
        {shipment.deliveredAt && (
          <div><span style={{ color: '#6B7280' }}>Delivered:</span> <span className="font-medium">{new Date(shipment.deliveredAt).toLocaleDateString()}</span></div>
        )}
      </div>
      {shipment.notes && <p className="text-sm mb-3 p-2 rounded" style={{ backgroundColor: '#F4F6FA', color: '#6B7280' }}>{shipment.notes}</p>}

      <table className="w-full text-xs">
        <thead>
          <tr style={{ backgroundColor: '#F4F6FA' }}>
            <th className="text-left px-2 py-1.5 font-semibold">Item</th>
            <th className="text-left px-2 py-1.5 font-semibold">SKU</th>
            <th className="text-center px-2 py-1.5 font-semibold">Qty Shipped</th>
          </tr>
        </thead>
        <tbody>
          {shipment?.items?.map?.((si: any) => (
            <tr key={si.id} className="border-b" style={{ borderColor: '#E2E5EB' }}>
              <td className="px-2 py-1.5 font-medium">{si?.requestItem?.product?.name}</td>
              <td className="px-2 py-1.5 text-gray-500 font-mono">{si?.requestItem?.product?.sku}</td>
              <td className="px-2 py-1.5 text-center font-medium">{si?.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Shipment Create/Edit Modal
function ShipmentModal({ requestId, items, shippedQtyMap, editingShipment, onClose, onSaved }: {
  requestId: string; items: any[]; shippedQtyMap: Record<string, number>;
  editingShipment: any; onClose: () => void; onSaved: () => void;
}) {
  const isEdit = !!editingShipment;
  const [carrier, setCarrier] = useState(editingShipment?.carrier ?? '');
  const [trackingNumber, setTrackingNumber] = useState(editingShipment?.trackingNumber ?? '');
  const [trackingUrl, setTrackingUrl] = useState(editingShipment?.trackingUrl ?? '');
  const [notes, setNotes] = useState(editingShipment?.notes ?? '');
  const [saving, setSaving] = useState(false);

  const [selectedItems, setSelectedItems] = useState<Record<string, number>>(() => {
    if (isEdit) return {};
    const init: Record<string, number> = {};
    items.forEach((item: any) => {
      const shipped = shippedQtyMap[item.id] || 0;
      const remaining = item.quantity - shipped;
      if (remaining > 0) init[item.id] = remaining;
    });
    return init;
  });

  const toggleItem = (itemId: string, maxQty: number) => {
    setSelectedItems(prev => {
      const copy = { ...prev };
      if (copy[itemId] !== undefined) { delete copy[itemId]; }
      else { copy[itemId] = maxQty; }
      return copy;
    });
  };

  const setItemQty = (itemId: string, qty: number) => {
    setSelectedItems(prev => ({ ...prev, [itemId]: Math.max(1, qty) }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isEdit) {
        const res = await fetch(`/api/requests/${requestId}/shipments/${editingShipment.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ carrier, trackingNumber, trackingUrl, notes }),
        });
        if (res.ok) { toast.success('Shipment updated'); onSaved(); }
        else { const d = await res.json(); toast.error(d?.error ?? 'Failed'); }
      } else {
        const shipItems = Object.entries(selectedItems)
          .filter(([, qty]) => qty > 0)
          .map(([requestItemId, quantity]) => ({ requestItemId, quantity }));
        if (shipItems.length === 0) { toast.error('Select at least one item to ship'); setSaving(false); return; }
        const res = await fetch(`/api/requests/${requestId}/shipments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ carrier, trackingNumber, trackingUrl, notes, items: shipItems }),
        });
        if (res.ok) { toast.success('Shipment created'); onSaved(); }
        else { const d = await res.json(); toast.error(d?.error ?? 'Failed'); }
      }
    } catch { toast.error('Error saving shipment'); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: '#E2E5EB' }}>
          <h3 className="text-lg font-bold" style={{ color: '#171B25' }}>
            {isEdit ? 'Edit Shipment Tracking' : 'Create New Shipment'}
          </h3>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: '#6B7280' }} /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: '#171B25' }}>Carrier</label>
              <select value={carrier} onChange={e => setCarrier(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }}>
                <option value="">Select carrier...</option>
                <option value="UPS">UPS</option>
                <option value="FedEx">FedEx</option>
                <option value="USPS">USPS</option>
                <option value="DHL">DHL</option>
                <option value="Freight">Freight / LTL</option>
                <option value="Courier">Local Courier</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: '#171B25' }}>Tracking Number</label>
              <input type="text" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="e.g. 1Z999AA10123456784" className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: '#171B25' }}>Tracking URL <span className="font-normal text-gray-400">(optional)</span></label>
            <input type="url" value={trackingUrl} onChange={e => setTrackingUrl(e.target.value)} placeholder="https://www.ups.com/track?tracknum=..." className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: '#171B25' }}>Notes <span className="font-normal text-gray-400">(optional)</span></label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Shipment notes..." className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }} />
          </div>

          {!isEdit && (
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#171B25' }}>Select Items to Ship</label>
              <div className="border rounded-md overflow-hidden" style={{ borderColor: '#E2E5EB' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: '#F4F6FA' }}>
                      <th className="text-left px-3 py-2 font-semibold w-8"></th>
                      <th className="text-left px-3 py-2 font-semibold">Item</th>
                      <th className="text-center px-3 py-2 font-semibold">Remaining</th>
                      <th className="text-center px-3 py-2 font-semibold">Ship Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item: any) => {
                      const shipped = shippedQtyMap[item.id] || 0;
                      const remaining = item.quantity - shipped;
                      const isSelected = selectedItems[item.id] !== undefined;
                      if (remaining <= 0) {
                        return (
                          <tr key={item.id} className="border-b opacity-50" style={{ borderColor: '#E2E5EB' }}>
                            <td className="px-3 py-2"><input type="checkbox" disabled checked className="rounded" /></td>
                            <td className="px-3 py-2">
                              <span className="font-medium">{item?.product?.name}</span>
                              <span className="text-gray-400 text-xs ml-2">{item?.product?.sku}</span>
                            </td>
                            <td className="px-3 py-2 text-center"><span className="text-green-600 font-semibold">All shipped</span></td>
                            <td className="px-3 py-2 text-center">-</td>
                          </tr>
                        );
                      }
                      return (
                        <tr key={item.id} className={`border-b ${isSelected ? 'bg-blue-50/50' : ''}`} style={{ borderColor: '#E2E5EB' }}>
                          <td className="px-3 py-2">
                            <input type="checkbox" checked={isSelected} onChange={() => toggleItem(item.id, remaining)} className="rounded" style={{ accentColor: '#0067B9' }} />
                          </td>
                          <td className="px-3 py-2">
                            <span className="font-medium">{item?.product?.name}</span>
                            <span className="text-gray-400 text-xs ml-2">{item?.product?.sku}</span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className="font-medium">{remaining}</span>
                            <span className="text-gray-400"> / {item.quantity}</span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            {isSelected ? (
                              <input
                                type="number"
                                min={1}
                                max={remaining}
                                value={selectedItems[item.id]}
                                onChange={e => setItemQty(item.id, Math.min(remaining, parseInt(e.target.value) || 1))}
                                className="w-16 px-2 py-1 border rounded text-center text-sm"
                                style={{ borderColor: '#E2E5EB' }}
                              />
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-2" style={{ borderColor: '#E2E5EB' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-md text-sm" style={{ color: '#6B7280' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#0067B9' }}>
            {saving ? 'Saving...' : isEdit ? 'Update Tracking' : 'Create Shipment'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Addendum Modal - for store changes and general addendums
function AddendumModal({ requestId, type, currentStore, onClose, onSaved }: {
  requestId: string; type: string; currentStore: any; onClose: () => void; onSaved: () => void;
}) {
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [storeSearch, setStoreSearch] = useState('');
  const [selectedNewStore, setSelectedNewStore] = useState<any>(null);

  useEffect(() => {
    if (type === 'STORE_CHANGE') {
      fetch('/api/stores').then(r => r.json()).then(d => setStores(d ?? [])).catch(() => {});
    }
  }, [type]);

  const filteredStores = stores.filter((s: any) =>
    s.id !== currentStore?.id &&
    (s.name?.toLowerCase?.()?.includes(storeSearch.toLowerCase()) ||
    s.siteNumber?.toLowerCase?.()?.includes(storeSearch.toLowerCase()))
  );

  const handleSave = async () => {
    if (!description.trim()) { toast.error('Please add a description'); return; }
    if (type === 'STORE_CHANGE' && !selectedNewStore) { toast.error('Please select a new store'); return; }

    setSaving(true);
    try {
      const body: any = {
        type,
        description,
        applyChanges: type === 'STORE_CHANGE',
      };

      if (type === 'STORE_CHANGE') {
        body.newStoreId = selectedNewStore.id;
        body.oldValue = currentStore ? `${currentStore.siteNumber} - ${currentStore.name}` : 'None';
        body.newValue = `${selectedNewStore.siteNumber} - ${selectedNewStore.name}`;
      }

      const res = await fetch(`/api/requests/${requestId}/addendums`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success('Addendum created');
        onSaved();
      } else {
        const d = await res.json();
        toast.error(d?.error ?? 'Failed');
      }
    } catch {
      toast.error('Error creating addendum');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: '#E2E5EB' }}>
          <h3 className="text-lg font-bold" style={{ color: '#171B25' }}>
            {type === 'STORE_CHANGE' ? 'Change Store (Addendum)' : 'Add Addendum'}
          </h3>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: '#6B7280' }} /></button>
        </div>

        <div className="p-6 space-y-4">
          {type === 'STORE_CHANGE' && (
            <>
              {currentStore && (
                <div className="p-3 rounded-md text-sm" style={{ backgroundColor: '#F4F6FA' }}>
                  <strong>Current Store:</strong> {currentStore.siteNumber} - {currentStore.name}
                  <br />
                  <span className="text-xs" style={{ color: '#6B7280' }}>{currentStore.address}, {currentStore.city}, {currentStore.state} {currentStore.zip}</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#171B25' }}>New Store *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={selectedNewStore ? `${selectedNewStore.siteNumber} - ${selectedNewStore.name}` : storeSearch}
                    onChange={e => { setStoreSearch(e.target.value); setSelectedNewStore(null); }}
                    className="w-full pl-10 pr-3 py-2 border rounded-md text-sm"
                    style={{ borderColor: '#E2E5EB' }}
                    placeholder="Search stores..."
                  />
                  {storeSearch && !selectedNewStore && filteredStores.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                      {filteredStores.map((s: any) => (
                        <button
                          key={s.id}
                          onClick={() => { setSelectedNewStore(s); setStoreSearch(''); }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b last:border-0"
                        >
                          <span className="font-medium">{s.siteNumber}</span> - {s.name}
                          <br />
                          <span className="text-xs text-gray-500">{s.address}, {s.city}, {s.state} {s.zip}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: '#171B25' }}>Description / Reason *</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-md text-sm"
              style={{ borderColor: '#E2E5EB' }}
              placeholder={type === 'STORE_CHANGE' ? 'Reason for store change...' : 'Describe the addendum...'}
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-2" style={{ borderColor: '#E2E5EB' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-md text-sm" style={{ color: '#6B7280' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#0067B9' }}>
            {saving ? 'Saving...' : 'Submit Addendum'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Add Notes Modal
function AddNotesModal({ requestId, currentNotes, onClose, onSaved }: {
  requestId: string; currentNotes: string; onClose: () => void; onSaved: () => void;
}) {
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!additionalNotes.trim()) { toast.error('Please enter a note'); return; }
    setSaving(true);
    try {
      const updatedNotes = currentNotes
        ? `${currentNotes}\n\n--- Additional Note (${new Date().toLocaleDateString()}) ---\n${additionalNotes}`
        : additionalNotes;

      const res = await fetch(`/api/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: updatedNotes }),
      });
      if (res.ok) {
        // Also create an addendum to track the note addition
        await fetch(`/api/requests/${requestId}/addendums`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'NOTE',
            description: additionalNotes,
          }),
        });
        toast.success('Notes updated');
        onSaved();
      } else {
        toast.error('Failed to update notes');
      }
    } catch {
      toast.error('Error updating notes');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: '#E2E5EB' }}>
          <h3 className="text-lg font-bold" style={{ color: '#171B25' }}>Add Additional Notes</h3>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: '#6B7280' }} /></button>
        </div>
        <div className="p-6 space-y-4">
          {currentNotes && (
            <div className="p-3 rounded-md text-sm whitespace-pre-wrap max-h-32 overflow-y-auto" style={{ backgroundColor: '#F4F6FA' }}>
              <strong className="text-xs" style={{ color: '#6B7280' }}>Existing Notes:</strong>
              <p className="mt-1">{currentNotes}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: '#171B25' }}>New Note *</label>
            <textarea
              value={additionalNotes}
              onChange={e => setAdditionalNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border rounded-md text-sm"
              style={{ borderColor: '#E2E5EB' }}
              placeholder="Enter additional notes..."
              autoFocus
            />
          </div>
        </div>
        <div className="border-t px-6 py-4 flex justify-end gap-2" style={{ borderColor: '#E2E5EB' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-md text-sm" style={{ color: '#6B7280' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#0067B9' }}>
            {saving ? 'Saving...' : 'Add Notes'}
          </button>
        </div>
      </div>
    </div>
  );
}
