import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Loader2
} from 'lucide-react';

interface Waiter {
  id: string;
  restaurantId?: string;
  name: string;
  mobile: string;
  employeeCode: string | null;
  status: string;
  tableAssignments: { tableNumber: string }[];
}

export const WaiterManagement: React.FC = () => {
  const { user, apiRequest } = useAuth();
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [allTables, setAllTables] = useState<any[]>([]);
  
  const [selectedWaiter, setSelectedWaiter] = useState<Waiter | null>(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);

  // Modals/forms
  const [showAddModal, setShowAddModal] = useState(false);

  // Waiter form states
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');

  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const fetchWaiters = async () => {
    try {
      const data = await apiRequest(`/restaurant/waiters?restaurantId=${user?.restaurantId || 'mock-id'}`);
      if (Array.isArray(data)) {
        setWaiters(data);
        if (selectedWaiter) {
          const updated = data.find((w: Waiter) => w.id === selectedWaiter.id);
          if (updated) setSelectedWaiter(updated);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch waiters.');
    }
  };

  const ensureDefaultTables = async (existingTables: any[]) => {
    const existingNums = new Set(
      existingTables.map(t => {
        const num = parseInt(t.tableNumber.replace(/\D/g, ''), 10);
        return isNaN(num) ? 0 : num;
      }).filter(n => n > 0)
    );

    const missingNums: number[] = [];
    for (let i = 1; i <= 20; i++) {
      if (!existingNums.has(i)) {
        missingNums.push(i);
      }
    }

    if (missingNums.length > 0) {
      const resolvedRestaurantId = user?.restaurantId || existingTables[0]?.restaurantId || '8853ae4b-561b-4abf-9d8f-57b353291afd';
      try {
        for (const num of missingNums) {
          await apiRequest('/restaurant/tables', {
            method: 'POST',
            body: JSON.stringify({
              restaurantId: resolvedRestaurantId,
              tableNumber: `Table ${num}`,
              capacity: 4,
              status: 'AVAILABLE'
            })
          });
        }
        const data = await apiRequest(`/restaurant/tables?restaurantId=${user?.restaurantId || 'mock-id'}`);
        if (Array.isArray(data)) {
          setAllTables(data);
          setTables(data.filter((t: any) => t.status !== 'DEACTIVATED'));
        }
      } catch (err) {
        console.error('Failed to create default tables:', err);
      }
    }
  };

  const fetchTables = async () => {
    try {
      const data = await apiRequest(`/restaurant/tables?restaurantId=${user?.restaurantId || 'mock-id'}`);
      if (Array.isArray(data)) {
        setAllTables(data);
        setTables(data.filter((t: any) => t.status !== 'DEACTIVATED'));
        await ensureDefaultTables(data);
      }
    } catch (err) {
      console.warn('Failed to fetch tables.');
    }
  };

  const loadData = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    await Promise.all([
      fetchWaiters(),
      fetchTables()
    ]);
    if (showLoader) setLoading(false);
  };

  useEffect(() => {
    loadData(true);
  }, []);

  const handleAddWaiter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mobile) return;
    const resolvedRestaurantId = user?.restaurantId || waiters[0]?.restaurantId || tables[0]?.restaurantId || '8853ae4b-561b-4abf-9d8f-57b353291afd';
    try {
      await apiRequest('/restaurant/waiters', {
        method: 'POST',
        body: JSON.stringify({
          restaurantId: resolvedRestaurantId,
          name,
          mobile,
          employeeCode: employeeCode || undefined
        })
      });
      setName('');
      setMobile('');
      setEmployeeCode('');
      setShowAddModal(false);
      addToast('Waiter profile registered successfully!', 'success');
      await loadData(false);
    } catch (err) {
      console.error(err);
      addToast('Failed to create waiter profile', 'error');
    }
  };

  const handleAddTableAuto = async () => {
    const activeAndDeactivatedNums = allTables.map(t => {
      const num = parseInt(t.tableNumber.replace(/\D/g, ''), 10);
      return isNaN(num) ? 0 : num;
    }).filter(n => n > 0);

    let nextNum = 1;
    while (activeAndDeactivatedNums.includes(nextNum)) {
      nextNum++;
    }
    const nextTableNumber = `Table ${nextNum}`;

    const existingDeactivated = allTables.find(
      t => {
        const existNum = t.tableNumber.replace(/\D/g, '');
        return existNum === String(nextNum) && t.status === 'DEACTIVATED';
      }
    );

    const resolvedRestaurantId = user?.restaurantId || tables[0]?.restaurantId || waiters[0]?.restaurantId || '8853ae4b-561b-4abf-9d8f-57b353291afd';

    try {
      setActioning(true);
      if (existingDeactivated) {
        await apiRequest(`/restaurant/tables/${existingDeactivated.id}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status: 'AVAILABLE' })
        });
      } else {
        await apiRequest('/restaurant/tables', {
          method: 'POST',
          body: JSON.stringify({
            restaurantId: resolvedRestaurantId,
            tableNumber: nextTableNumber,
            tableName: null,
            capacity: 4,
            floor: 'Ground Floor',
            status: 'AVAILABLE'
          })
        });
      }
      await loadData(false);
    } catch (err) {
      console.error(err);
      addToast('Failed to create table', 'error');
    } finally {
      setActioning(false);
    }
  };

  const handleTableClick = async (table: any) => {
    const assignedWaiter = getAssignedWaiterForTable(table.tableNumber);

    if (selectedWaiter) {
      if (assignedWaiter) {
        if (assignedWaiter.id === selectedWaiter.id) {
          await handleUnassignTable(table.tableNumber);
        } else {
          setActioning(true);
          try {
            await apiRequest('/restaurant/waiters/unassign', {
              method: 'POST',
              body: JSON.stringify({ tableNumber: table.tableNumber })
            });
            await apiRequest('/restaurant/waiters/assign', {
              method: 'POST',
              body: JSON.stringify({ waiterId: selectedWaiter.id, tableNumber: table.tableNumber })
            });
            await loadData(false);
          } catch (err: any) {
            console.error(err);
            addToast(err.message || 'Error reassigning table', 'error');
          } finally {
            setActioning(false);
          }
        }
      } else {
        await handleAssignTableDirect(table.tableNumber, selectedWaiter.id);
      }
    } else {
      if (assignedWaiter) {
        await handleUnassignTable(table.tableNumber);
      }
    }
  };

  const handleAssignTableDirect = async (tableNumber: string, waiterId: string) => {
    setActioning(true);
    try {
      await apiRequest('/restaurant/waiters/assign', {
        method: 'POST',
        body: JSON.stringify({
          waiterId,
          tableNumber
        })
      });
      await loadData(false);
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'Error assigning table', 'error');
    } finally {
      setActioning(false);
    }
  };

  const handleUnassignTable = async (tableNumber: string) => {
    setActioning(true);
    try {
      await apiRequest('/restaurant/waiters/unassign', {
        method: 'POST',
        body: JSON.stringify({
          tableNumber
        })
      });
      await loadData(false);
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'Error unassigning table', 'error');
    } finally {
      setActioning(false);
    }
  };

  const getAssignedWaiterForTable = (tableNumber: string): Waiter | null => {
    const cleanNum = tableNumber.replace(/\D/g, '').trim();
    return waiters.find(w => 
      w.tableAssignments.some(a => {
        const cleanAssign = a.tableNumber.replace(/\D/g, '').trim();
        return cleanAssign === cleanNum;
      })
    ) || null;
  };

  // Sort tables numerically
  const sortedTables = [...tables].sort((a, b) => {
    const numA = parseInt(a.tableNumber.replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(b.tableNumber.replace(/\D/g, ''), 10) || 0;
    return numA - numB;
  });

  return (
    <div className="p-6 text-black font-sans bg-white rounded-2xl border border-neutral-200 max-w-6xl mx-auto shadow-sm space-y-6">
      
      {/* Toast Alert Popups */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
        {toasts.map(toast => {
          let borderTheme = 'border-emerald-500 text-emerald-800 bg-emerald-50/50';
          if (toast.type === 'error') borderTheme = 'border-rose-500 text-rose-800 bg-rose-50/50';
          else if (toast.type === 'info') borderTheme = 'border-amber-500 text-amber-800 bg-amber-50/50';

          return (
            <div
              key={toast.id}
              className={`border-l-4 p-4 rounded-xl shadow-sm flex items-center justify-between gap-3 border bg-white text-left ${borderTheme}`}
            >
              <div className="flex-1 text-xs font-normal text-black">{toast.message}</div>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-neutral-400 hover:text-neutral-700 text-xs font-normal"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-neutral-100">
        <div className="text-left">
          <h1 className="text-lg font-bold text-black uppercase tracking-wider">Waiter Management</h1>
          <p className="text-xs text-neutral-600 font-normal mt-1">
            Assign staff to tables directly. Select a waiter, then click any table.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-normal py-2 px-3.5 rounded-lg flex items-center gap-1.5 text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Waiter</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT PANEL: WAITSTAFF LIST */}
          <div className="lg:col-span-4 flex flex-col h-[480px]">
            <h2 className="text-xs font-normal uppercase tracking-wider text-black pb-2 border-b border-neutral-100 flex-shrink-0">
              Waitstaff
            </h2>

            <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1 scrollbar-none">
              {waiters.map(waiter => {
                const isSelected = selectedWaiter?.id === waiter.id;
                const assignedCount = waiter.tableAssignments.length;

                return (
                  <div
                    key={waiter.id}
                    onClick={() => setSelectedWaiter(isSelected ? null : waiter)}
                    className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected 
                        ? 'bg-neutral-50 border-black ring-1 ring-black/10 shadow-xs' 
                        : 'bg-white border-neutral-100 hover:border-neutral-200 hover:shadow-xs'
                    }`}
                  >
                    <div className="text-left">
                      <p className="font-bold text-black text-xs">{waiter.name}</p>
                      <p className="text-[10px] text-neutral-500 font-normal mt-0.5">
                        {assignedCount} {assignedCount === 1 ? 'Table' : 'Tables'} assigned
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT PANEL: COMPACT TABLE SELECTOR BUTTONS */}
          <div className="lg:col-span-8 flex flex-col h-[480px] lg:border-l lg:border-neutral-100 lg:pl-6">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-100 flex-shrink-0">
              <h2 className="text-xs font-normal uppercase tracking-wider text-black">
                Tables Layout
              </h2>
              <button
                onClick={handleAddTableAuto}
                disabled={actioning}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-normal py-1 px-2.5 rounded-lg flex items-center gap-1 text-[10px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <Plus className="w-3 h-3" />
                <span>Add Table</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mt-3 p-4 bg-neutral-50/40 rounded-xl border border-neutral-200/50 scrollbar-none">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 items-start">
                {sortedTables.map(table => {
                  const assignedWaiter = getAssignedWaiterForTable(table.tableNumber);
                  const displayDigits = table.tableNumber.replace(/\D/g, '');

                  return (
                    <button
                      key={table.id}
                      onClick={() => handleTableClick(table)}
                      disabled={actioning}
                      className={`w-full py-2.5 px-3 rounded-xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center min-h-[52px] shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] ${
                        assignedWaiter 
                          ? 'border-emerald-600 bg-emerald-600 text-white' 
                          : 'border-emerald-600/40 bg-white text-black hover:border-emerald-600'
                      }`}
                    >
                      <span className={`font-bold text-xs ${assignedWaiter ? 'text-white' : 'text-black'}`}>
                        Table {displayDigits || table.tableNumber}
                      </span>
                      <span className={`text-[9px] font-normal mt-0.5 truncate max-w-[80px] ${assignedWaiter ? 'text-white/90' : 'text-neutral-500'}`}>
                        {assignedWaiter ? assignedWaiter.name : 'Unassigned'}
                      </span>
                    </button>
                  );
                })}
                {tables.length === 0 && (
                  <p className="text-neutral-400 italic text-xs py-8 w-full text-center col-span-full font-normal">
                    No active tables found. Click "Add Table" to create.
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* --- ADD WAITER MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-xl border border-neutral-200 p-6 text-left space-y-4 shadow-xl">
            <h3 className="font-normal text-black text-sm uppercase tracking-wider border-b border-neutral-100 pb-2">
              Waiter Registration
            </h3>
            
            <form onSubmit={handleAddWaiter} className="space-y-4 text-xs font-normal text-slate-700">
              <div>
                <label className="block mb-1 text-[10px] uppercase tracking-wider font-normal text-slate-500">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-slate-50/50 px-4 py-2 text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black transition"
                />
              </div>

              <div>
                <label className="block mb-1 text-[10px] uppercase tracking-wider font-normal text-slate-500">Employee ID / Code</label>
                <input
                  type="text"
                  placeholder="e.g. WT005"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-slate-50/50 px-4 py-2 text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black transition"
                />
              </div>

              <div>
                <label className="block mb-1 text-[10px] uppercase tracking-wider font-normal text-slate-500">Mobile Contact *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9876543214"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-slate-50/50 px-4 py-2 text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black transition"
                />
              </div>

              <div className="flex gap-2 pt-2 text-xs font-normal">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Register Staff
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-neutral-100 text-neutral-700 px-4 py-2 rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer uppercase"
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
