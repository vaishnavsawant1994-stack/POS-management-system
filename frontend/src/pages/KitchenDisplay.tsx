import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Play, 
  Check, 
  Trash2, 
  UtensilsCrossed, 
  Clock, 
  Bell, 
  AlertCircle 
} from 'lucide-react';

export const KitchenDisplay: React.FC = () => {
  const { user, apiRequest } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Play simulated sound when a new order arrives
  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);

      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        gain2.gain.setValueAtTime(0.3, audioCtx.currentTime);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.25);
      }, 180);
    } catch (e) {
      console.warn('Audio play blocked or unsupported by browser client policies');
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await apiRequest(`/restaurant/orders?restaurantId=${user?.restaurantId || 'mock-id'}`);
      
      // Check if there is a new order to trigger sound
      if (orders.length > 0 && data.length > orders.length) {
        const hasNew = data.some((n: any) => !orders.some(o => o.id === n.id));
        if (hasNew) {
          playAlertSound();
        }
      }
      
      setOrders(data);
    } catch (err) {
      console.warn('Utilizing KDS mock fallback data.');
      // Fallback mocks
      setOrders([
        {
          id: 'ko-1',
          source: 'QR',
          table: { tableNumber: 'Table 3' },
          status: 'NEW',
          notes: 'No Onion, extra crispy fries',
          createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          items: [
            { id: 'koi-1', quantity: 2, menuItem: { name: 'Cheese Burger' }, notes: 'Extra cheese' },
            { id: 'koi-2', quantity: 1, menuItem: { name: 'Coca Cola' } }
          ]
        },
        {
          id: 'ko-2',
          source: 'SWIGGY',
          status: 'ACCEPTED',
          createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
          items: [
            { id: 'koi-3', quantity: 1, menuItem: { name: 'Margherita Pizza' }, notes: 'Less spicy' }
          ]
        },
        {
          id: 'ko-3',
          source: 'ZOMATO',
          status: 'PREPARING',
          createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
          items: [
            { id: 'koi-4', quantity: 1, menuItem: { name: 'Garlic Bread with Cheese' } },
            { id: 'koi-5', quantity: 1, menuItem: { name: 'Classic Veg Burger' } }
          ]
        },
        {
          id: 'ko-4',
          source: 'WALK_IN',
          table: { tableNumber: 'Table 1' },
          status: 'READY',
          createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          items: [
            { id: 'koi-6', quantity: 1, menuItem: { name: 'Cheese Burger' } }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
  }, [orders]);

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    try {
      await apiRequest(`/restaurant/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });
      fetchOrders();
    } catch (err) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o).filter(o => o.status !== 'SERVED'));
    }
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'QR': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'SWIGGY': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'ZOMATO': return 'bg-red-100 text-red-700 border-red-200';
      case 'WALK_IN': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusButton = (order: any) => {
    switch (order.status) {
      case 'NEW':
        return (
          <button
            onClick={() => handleUpdateStatus(order.id, 'ACCEPTED')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>Accept Order</span>
          </button>
        );
      case 'ACCEPTED':
        return (
          <button
            onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Start Preparing</span>
          </button>
        );
      case 'PREPARING':
        return (
          <button
            onClick={() => handleUpdateStatus(order.id, 'READY')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Mark Ready</span>
          </button>
        );
      case 'READY':
        return (
          <button
            onClick={() => handleUpdateStatus(order.id, 'SERVED')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>Serve Dish</span>
          </button>
        );
      default:
        return null;
    }
  };

  const getElapsedTime = (createdTime: string) => {
    const elapsed = Date.now() - new Date(createdTime).getTime();
    const minutes = Math.floor(elapsed / 60000);
    return `${minutes} min ago`;
  };

  const getTicketHeaderColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-600 text-white';
      case 'ACCEPTED': return 'bg-sky-500 text-white';
      case 'PREPARING': return 'bg-amber-500 text-white';
      case 'READY': return 'bg-emerald-600 text-white';
      default: return 'bg-slate-700 text-white';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Kitchen Display Screen (KDS)</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Live orders display for chefs. System triggers audible chimes for new incoming menu tickets.</p>
        </div>
        <button
          onClick={playAlertSound}
          className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-2 px-3.5 rounded-xl flex items-center gap-2 text-xs transition-colors"
        >
          <Bell className="w-4.5 h-4.5 text-slate-500" />
          <span>Test Sound System</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <div>
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200/80 rounded-2xl text-center p-6">
              <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                <UtensilsCrossed className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-base">All caught up!</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">There are no active orders in the kitchen. New QR, Swiggy, Zomato, or walk-in orders will appear here instantly.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {orders.map(order => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between"
                >
                  {/* Ticket Header */}
                  <div className={`px-4 py-3 flex justify-between items-center ${getTicketHeaderColor(order.status)}`}>
                    <span className="font-extrabold text-sm tracking-wide">
                      {order.table?.tableNumber || 'Takeaway'}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] font-bold opacity-90">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{getElapsedTime(order.createdAt)}</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex-1 space-y-4">
                    <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase ${getSourceBadgeColor(order.source)}`}>
                        {order.source}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">ID: {order.id.slice(0, 5).toUpperCase()}</span>
                    </div>

                    {/* Items */}
                    <div className="space-y-3">
                      {order.items.map((it: any) => (
                        <div key={it.id} className="flex justify-between items-start">
                          <div>
                            <span className="text-sm font-extrabold text-slate-800 mr-2">{it.quantity}x</span>
                            <span className="text-sm font-bold text-slate-700">{it.menuItem?.name || 'Dish'}</span>
                            {it.notes && (
                              <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Note: "{it.notes}"</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Global order notes */}
                    {order.notes && (
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] font-semibold text-slate-600 leading-normal">
                          "{order.notes}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
                    <div className="flex-1">
                      {getStatusButton(order)}
                    </div>
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                      title="Cancel Order"
                      className="p-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg transition-colors bg-white"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KitchenDisplay;
