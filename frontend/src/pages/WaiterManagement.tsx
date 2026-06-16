import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Phone } from 'lucide-react';

export const WaiterManagement: React.FC = () => {
  const { user, apiRequest } = useAuth();
  const [waiters, setWaiters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals/forms
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');

  const fetchWaiters = async () => {
    try {
      const data = await apiRequest(`/restaurant/waiters?restaurantId=${user?.restaurantId || 'mock-id'}`);
      setWaiters(data);
    } catch (err) {
      console.warn('Utilizing waiter mock fallback data.');
      setWaiters([
        { id: 'w-1', name: 'David Smith', mobile: '9988776655', status: 'ACTIVE', ordersServed: 18, salesHandled: 242.50 },
        { id: 'w-2', name: 'Sarah Jones', mobile: '9988776644', status: 'ACTIVE', ordersServed: 24, salesHandled: 385.90 },
        { id: 'w-3', name: 'Alex Miller', mobile: '9988776633', status: 'ACTIVE', ordersServed: 12, salesHandled: 154.20 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaiters();
  }, []);

  const handleAddWaiter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mobile) return;
    try {
      await apiRequest('/restaurant/waiters', {
        method: 'POST',
        body: JSON.stringify({
          restaurantId: user?.restaurantId || 'mock-id',
          name,
          mobile
        })
      });
      setName('');
      setMobile('');
      setShowAddModal(false);
      fetchWaiters();
    } catch (err) {
      setWaiters(prev => [
        ...prev,
        { id: `w-${Date.now()}`, name, mobile, status: 'ACTIVE', ordersServed: 0, salesHandled: 0.0 }
      ]);
      setName('');
      setMobile('');
      setShowAddModal(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Waitstaff & Performance</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Manage waiters, assign dining duties, and monitor sales contributions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/10 text-sm transition-all"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>Add Waiter Profile</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {waiters.map(waiter => (
            <div
              key={waiter.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-extrabold text-sm border border-emerald-100">
                  {waiter.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">{waiter.name}</h3>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5 font-semibold">
                    <Phone className="w-3 h-3" />
                    <span>{waiter.mobile}</span>
                  </div>
                </div>
                <span className="text-[9px] font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded uppercase ml-auto">
                  {waiter.status}
                </span>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Orders Served</span>
                  <span className="text-base font-extrabold text-slate-800 mt-0.5 block">{waiter.ordersServed}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Sales Handled</span>
                  <span className="text-base font-extrabold text-slate-800 mt-0.5 block">₹{waiter.salesHandled?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- ADD WAITER MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 p-6 animate-fade-in">
            <h3 className="font-extrabold text-slate-800 text-lg mb-4">Register Waiter Profile</h3>
            <form onSubmit={handleAddWaiter} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jack Sparrow"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-600 bg-slate-50/50"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Mobile Contact</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9876543210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-600 bg-slate-50/50"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs shadow-lg transition-colors"
                >
                  Register Staff
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-100 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default WaiterManagement;
