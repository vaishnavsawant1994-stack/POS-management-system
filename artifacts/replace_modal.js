const fs = require('fs');
const path = require('path');

const targetFilePath = 'c:/Users/HP/OneDrive/Desktop/POS_Inventory/POS/frontend/src/pages/CashierDashboard.tsx';
let content = fs.readFileSync(targetFilePath, 'utf8');

// The new Modal code
const newModalCode = `        {/* MODAL 2: GENERATE BILL / SETTLEMENT MODAL */}
        {selectedTable && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden font-sans">
          <div className="bg-white dark:bg-[#0c1024] border border-slate-105 dark:border-slate-850 rounded-2xl w-[95vw] max-w-6xl h-[90vh] shadow-xl flex flex-col text-left animate-[zoomIn_0.18s_ease-out] relative overflow-hidden">
            
            {/* Close Button */}
            {!showSuccessScreen && (
              <button
                onClick={() => {
                  setSelectedTable(null);
                  setIsWaitingPayment(false);
                  setPaymentCountdown(null);
                  setCardState('IDLE');
                  setCardDetails(null);
                }}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer z-10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {showSuccessScreen ? (
              <div className="flex-grow flex-1 flex flex-col items-center justify-center py-12 px-8 text-center space-y-6 animate-[fadeIn_0.22s_ease-out] w-full h-full bg-slate-50/50 dark:bg-[#080b18]">
                {/* Checkmark Circle */}
                <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 transform scale-105 animate-[bounce_1.8s_infinite] shrink-0">
                  <Check className="w-8 h-8 stroke-[3.5]" />
                </div>
                <div className="space-y-4 max-w-md w-full">
                  <h2 className="text-xl font-extrabold text-slate-855 dark:text-white uppercase tracking-wider">
                    Payment Successful
                  </h2>
                  <div className="bg-white dark:bg-[#0c1024] border border-slate-105 dark:border-slate-850 p-5 rounded-2xl shadow-sm space-y-3 text-xs font-semibold text-slate-700 dark:text-slate-350">
                    <p className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-850">
                      <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Invoice Code</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{settledInvoice?.invoiceNumber || 'INV-0001'}</span>
                    </p>
                    <p className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-850">
                      <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Settled Amount</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{(settledInvoice?.totalAmount || currentBill.grandTotal).toFixed(2)}</span>
                    </p>
                    <p className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-850">
                      <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Payment Method</span>
                      <span className="font-bold text-slate-905 dark:text-white uppercase">{settledInvoice?.paymentMode || paymentMethod}</span>
                    </p>
                    <div className="flex items-center justify-center gap-4 pt-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                      <span className="flex items-center gap-1">✓ Invoice Saved</span>
                      <span className="flex items-center gap-1">✓ Table Released</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 w-full max-w-md shrink-0">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 uppercase tracking-widest"
                  >
                    <Printer className="w-4 h-4" /> Print Invoice
                  </button>
                  <button
                    onClick={() => {
                      if (settledInvoice?.pdfUrl) {
                        window.open(\`http://localhost:5000\${settledInvoice.pdfUrl}\`, '_blank');
                      } else {
                        addNotification('error', 'Invoice PDF not generated yet.');
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-slate-105 hover:bg-slate-205 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-800 dark:text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-widest border border-slate-205 dark:border-slate-800"
                  >
                    <Receipt className="w-4 h-4" /> View Invoice
                  </button>
                  <button
                    onClick={handleDone}
                    className="flex-1 px-4 py-3 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center uppercase tracking-widest"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-grow flex-1 flex flex-col md:flex-row h-full overflow-hidden">
                {/* LEFT COLUMN: BILL SUMMARY */}
                <div className="w-full md:w-[45%] border-r border-slate-105 dark:border-slate-855 flex flex-col h-1/2 md:h-full overflow-hidden p-6 bg-slate-50/50 dark:bg-slate-950/10 text-left">
                  {/* Bill Header */}
                  <div className="shrink-0 pb-4 border-b border-slate-100 dark:border-slate-855 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-base font-extrabold text-slate-850 dark:text-white leading-tight">
                          {settings.shopName || 'Gourmet Bistro'}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Invoice Preview</span>
                      </div>
                      <span className="px-2.5 py-1 bg-slate-105 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-extrabold font-mono border border-slate-205 dark:border-slate-700">
                        {selectedTable.tableNumber}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[10px] text-slate-505 dark:text-slate-400 font-semibold">
                      <div>
                        <span className="text-slate-400 block font-bold uppercase tracking-wider text-[8px]">Guest Name</span>
                        <span className="text-slate-800 dark:text-slate-202 font-bold">{currentBill.customerName || 'Walk-in Guest'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold uppercase tracking-wider text-[8px]">Date & Time</span>
                        <span className="text-slate-800 dark:text-slate-202 font-bold">{todayDateStr} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Scrollable Food Items list */}
                  <div className="flex-grow overflow-y-auto my-4 pr-1 scrollbar-thin">
                    <table className="w-full text-left text-xs font-semibold border-collapse">
                      <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10">
                        <tr>
                          <th className="py-2 px-3 text-left text-slate-400 font-bold uppercase tracking-wider text-[9px]">Item</th>
                          <th className="py-2 px-3 text-center text-slate-400 font-bold uppercase tracking-wider text-[9px] w-16">Qty</th>
                          <th className="py-2 px-3 text-right text-slate-400 font-bold uppercase tracking-wider text-[9px] w-20">Price</th>
                          <th className="py-2 px-3 text-right text-slate-400 font-bold uppercase tracking-wider text-[9px] w-20">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-105 dark:divide-slate-900">
                        {currentBill.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-100/30 dark:hover:bg-slate-900/10">
                            <td className="py-2.5 px-3 text-slate-900 dark:text-white font-extrabold truncate max-w-[140px]">
                              {item.menuItem?.name || 'Dish'}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-600 dark:text-slate-400">
                              {item.quantity}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-500 font-mono">
                              ₹{item.unitPrice.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-slate-905 dark:text-white">
                              ₹{(item.unitPrice * item.quantity).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Always Visible Totals Card */}
                  <div className="shrink-0 bg-slate-50 dark:bg-slate-900/25 p-4 rounded-xl border border-slate-150 dark:border-slate-850 space-y-2 text-xs font-semibold text-slate-705 dark:text-slate-350">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Subtotal</span>
                      <span className="font-mono text-slate-900 dark:text-white">₹{currentBill.subtotal.toFixed(2)}</span>
                    </div>
                    {currentBill.discountValue > 0 && (
                      <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                        <span className="font-bold uppercase tracking-wider text-[9px]">Discount</span>
                        <span className="font-mono font-black">-₹{currentBill.discountValue.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">GST (5%)</span>
                      <span className="font-mono text-slate-900 dark:text-white">₹{currentBill.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Service Charge (5%)</span>
                      <span className="font-mono text-slate-900 dark:text-white">₹{currentBill.serviceChargeAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-205 dark:border-slate-800 pt-2.5 mt-1">
                      <span className="font-extrabold uppercase tracking-wider text-xs text-slate-900 dark:text-white">Grand Total</span>
                      <span className="text-base font-mono font-black text-emerald-650 dark:text-emerald-450">₹{currentBill.grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: PAYMENT PANEL */}
                <div className="w-full md:w-[55%] flex flex-col h-full overflow-hidden p-6 bg-white dark:bg-[#0c1024] text-left">
                  {isWaitingPayment ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4 py-6 animate-[fadeIn_0.22s_ease-out] h-full overflow-y-auto">
                      <div className="w-12 h-12 bg-amber-50 dark:bg-amber-955/20 text-amber-505 rounded-full flex items-center justify-center animate-pulse shrink-0">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-855 dark:text-white text-sm uppercase tracking-wider">Waiting for UPI Payment...</h4>
                        <p className="text-[11px] text-slate-400 font-semibold">Customer is scanning the merchant UPI QR</p>
                        {paymentCountdown !== null && (
                          <div className="text-2xl font-mono font-black text-amber-600 dark:text-amber-500 mt-1">
                            {formatCountdown(paymentCountdown)}
                          </div>
                        )}
                      </div>

                      {/* Display dynamic business UPI QR */}
                      <div className="bg-white p-3 rounded-xl border border-slate-202 shadow-sm flex flex-col items-center gap-1.5 shrink-0">
                        <img
                          src={\`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=\${encodeURIComponent(
                            \`upi://pay?pa=\${settings.upiId}&pn=\${encodeURIComponent(settings.shopName)}&am=\${currentBill.grandTotal.toFixed(2)}&cu=INR\`
                          )}\`}
                          alt="UPI QR code"
                          className="w-28 h-28"
                        />
                        <span className="text-[9px] font-bold text-slate-700">Scan via Any UPI App</span>
                        <span className="text-[8px] font-mono text-slate-400">UPI ID: \${settings.upiId}</span>
                      </div>

                      <div className="flex gap-3 w-full max-w-xs pt-2 shrink-0">
                        <button
                          onClick={handleConfirmSettle}
                          className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Confirm Received
                        </button>
                        <button
                          onClick={() => {
                            setIsWaitingPayment(false);
                            setPaymentCountdown(null);
                          }}
                          className="flex-grow bg-slate-105 hover:bg-slate-205 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer border border-slate-205 dark:border-slate-800"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-905 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-850 flex items-center gap-2 shrink-0">
                        <CreditCard className="w-4 h-4 text-emerald-500" />
                        <span>Process Settlement / Payment</span>
                      </h3>

                      <div className="flex-grow overflow-y-auto space-y-4 my-3 pr-1 scrollbar-thin">
                        {/* Discount Input */}
                        <div className="bg-slate-50/50 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-805 rounded-xl p-3.5 space-y-2 shrink-0">
                          <label className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                            Apply Bill Discount
                          </label>
                          <div className="flex items-center gap-3">
                            <div className="flex border border-slate-202 dark:border-slate-800 rounded-lg overflow-hidden text-xs shrink-0 bg-white dark:bg-[#0c1024]">
                              <button
                                onClick={() => setUseDiscountPercent(true)}
                                className={\`px-2.5 py-1.5 font-bold cursor-pointer transition-colors \${
                                  useDiscountPercent
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white'
                                    : 'text-slate-400 hover:text-slate-600'
                                }\`}
                              >
                                %
                              </button>
                              <button
                                onClick={() => setUseDiscountPercent(false)}
                                className={\`px-2.5 py-1.5 font-bold cursor-pointer transition-colors \${
                                  !useDiscountPercent
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white'
                                    : 'text-slate-400 hover:text-slate-600'
                                }\`}
                              >
                                ₹
                              </button>
                            </div>
                            <input
                              type="number"
                              value={useDiscountPercent ? discountPercent : discountAmount}
                              onChange={(e) => {
                                const val = Math.max(0, parseFloat(e.target.value) || 0);
                                if (useDiscountPercent) {
                                  setDiscountPercent(Math.min(100, val));
                                } else {
                                  setDiscountAmount(Math.min(currentBill.subtotal, val));
                                }
                              }}
                              placeholder={useDiscountPercent ? 'Enter %' : 'Enter amount'}
                              className="flex-grow px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-[#0c1024] border border-slate-202 dark:border-slate-800 text-slate-900 dark:text-white font-extrabold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                            />
                          </div>
                        </div>

                        {/* Payment Cards 2x2 Grid */}
                        <div className="space-y-3">
                          <label className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                            Choose Payment Method
                          </label>
                          <div className="grid grid-cols-2 gap-3 shrink-0">
                            {[
                              { id: 'CASH', title: 'Cash Payment', desc: 'Settle physical cash', icon: IndianRupee, colorClass: 'text-emerald-500 bg-emerald-505/5 dark:bg-emerald-950/20' },
                              { id: 'UPI', title: 'UPI QR Code', desc: 'Scan merchant QR', icon: QrCode, colorClass: 'text-amber-500 bg-amber-500/5 dark:bg-amber-955/20' },
                              { id: 'CARD', title: 'Card Terminal', desc: 'Swipe/Tap credit or debit', icon: CreditCard, colorClass: 'text-blue-500 bg-blue-500/5 dark:bg-blue-955/20' },
                              { id: 'SPLIT', title: 'Split Payment', desc: 'Multiple methods combined', icon: SplitIcon, colorClass: 'text-purple-500 bg-purple-500/5 dark:bg-purple-955/20' }
                            ].map((method) => {
                              const isSelected = paymentMethod === method.id;
                              return (
                                <button
                                  key={method.id}
                                  type="button"
                                  onClick={() => {
                                    setPaymentMethod(method.id as any);
                                    if (method.id === 'CASH') setCashReceived('');
                                    if (method.id === 'CARD') {
                                      setCardState('IDLE');
                                      setCardDetails(null);
                                    }
                                  }}
                                  className={\`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer select-none h-24 \${
                                    isSelected
                                      ? 'border-emerald-505 bg-emerald-50/5 dark:bg-emerald-950/10 ring-2 ring-emerald-500/5 shadow-xs'
                                      : 'border-slate-202 dark:border-slate-800 bg-white dark:bg-[#0c1024] hover:border-slate-300 dark:hover:border-slate-700'
                                  }\`}
                                >
                                  <div className="flex justify-between items-start w-full">
                                    <div className={\`p-1.5 rounded-lg \${method.colorClass}\`}>
                                      <method.icon className="w-4 h-4" />
                                    </div>
                                    <span className={\`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 \${
                                      isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                                    }\`}>
                                      {isSelected && <Check className="w-2 h-2 text-white stroke-[3.5]" />}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-xs font-bold text-slate-800 dark:text-white block">{method.title}</span>
                                    <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">{method.desc}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Selected Payment Detail Panel */}
                        <div className="bg-slate-50 dark:bg-slate-900/10 border border-slate-202 dark:border-slate-800 rounded-xl p-4 min-h-[140px] flex flex-col justify-center shrink-0">
                          {paymentMethod === 'CASH' && (
                            <div className="space-y-3 animate-[fadeIn_0.15s_ease-out] text-left">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white dark:bg-[#0c1024] border border-slate-202 dark:border-slate-800 p-3 rounded-lg">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Bill Total</span>
                                  <span className="text-sm font-black text-slate-900 dark:text-white block mt-0.5">
                                    ₹{currentBill.grandTotal.toFixed(2)}
                                  </span>
                                </div>
                                <div className="bg-white dark:bg-[#0c1024] border border-slate-202 dark:border-slate-805 p-3 rounded-lg focus-within:border-emerald-500 transition-colors">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Amount Received</span>
                                  <input
                                    type="text"
                                    value={cashReceived}
                                    onChange={(e) => setCashReceived(e.target.value.replace(/[^0-9.]/g, ''))}
                                    placeholder="0.00"
                                    className="w-full bg-transparent border-none p-0 text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:ring-0 mt-0.5"
                                  />
                                </div>
                              </div>
                              <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-lg flex justify-between items-center">
                                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-450 uppercase tracking-wider">Change to Return</span>
                                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                                  ₹{changeReturned.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          )}

                          {paymentMethod === 'UPI' && (
                            <div className="flex flex-col items-center justify-center text-center space-y-2 py-1 animate-[fadeIn_0.15s_ease-out]">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsWaitingPayment(true);
                                  setPaymentCountdown(120); // 2 minutes countdown
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                              >
                                <QrCode className="w-4 h-4" />
                                Generate Payment QR Code
                              </button>
                              <p className="text-[10px] text-slate-400 font-semibold">Generate customer facing scan QR for ₹{currentBill.grandTotal.toFixed(2)}</p>
                            </div>
                          )}

                          {paymentMethod === 'CARD' && (
                            <div className="space-y-3 animate-[fadeIn_0.15s_ease-out] text-left">
                              <div className="bg-white dark:bg-[#0c1024] border border-slate-202 dark:border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center text-center py-4">
                                {cardState === 'IDLE' && (
                                  <div className="space-y-2">
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                                      Swipe, tap, or insert customer card on POS terminal.
                                    </p>
                                    <button
                                      type="button"
                                      onClick={handleCardSwipeSimulate}
                                      className="bg-slate-900 hover:bg-black text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
                                    >
                                      Simulate Terminal Swipe
                                    </button>
                                  </div>
                                )}

                                {(cardState === 'SWIPING' || cardState === 'AUTHORIZING') && (
                                  <div className="flex flex-col items-center gap-2 py-2">
                                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-[10px] text-slate-600 dark:text-slate-350 font-bold uppercase tracking-wider">
                                      {cardState === 'SWIPING' ? 'Swiping Card...' : 'Authorizing Transaction...'}
                                    </p>
                                  </div>
                                )}

                                {cardState === 'APPROVED' && cardDetails && (
                                  <div className="space-y-2 w-full text-xs">
                                    <span className="text-[9px] font-bold text-emerald-705 dark:text-emerald-455 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full uppercase tracking-wider block mx-auto w-fit border border-emerald-200/50 dark:border-emerald-800">
                                      ✓ Transaction Approved
                                    </span>
                                    <div className="grid grid-cols-2 gap-2 text-left pt-1 text-[10px] font-semibold text-slate-500">
                                      <div>Card: <span className="text-slate-900 dark:text-white font-bold">{cardDetails.type} ({cardDetails.number})</span></div>
                                      <div>Tx ID: <span className="text-slate-900 dark:text-white font-mono font-bold">{cardDetails.txId}</span></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {paymentMethod === 'SPLIT' && (
                            <div className="space-y-3 animate-[fadeIn_0.15s_ease-out] text-left">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Split Mode Breakdown</span>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="bg-white dark:bg-[#0c1024] border border-slate-202 dark:border-slate-805 p-2.5 rounded-lg">
                                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Cash Port</span>
                                  <input
                                    type="text"
                                    value={splitCash}
                                    onChange={(e) => setSplitCash(e.target.value.replace(/[^0-9.]/g, ''))}
                                    placeholder="0.00"
                                    className="w-full bg-transparent border-none p-0 text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-0 mt-0.5"
                                  />
                                </div>
                                <div className="bg-white dark:bg-[#0c1024] border border-slate-202 dark:border-slate-805 p-2.5 rounded-lg">
                                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Card Port</span>
                                  <input
                                    type="text"
                                    value={splitCard}
                                    onChange={(e) => setSplitCard(e.target.value.replace(/[^0-9.]/g, ''))}
                                    placeholder="0.00"
                                    className="w-full bg-transparent border-none p-0 text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-0 mt-0.5"
                                  />
                                </div>
                                <div className="bg-white dark:bg-[#0c1024] border border-slate-202 dark:border-slate-805 p-2.5 rounded-lg">
                                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">UPI Port</span>
                                  <input
                                    type="text"
                                    value={splitUpi}
                                    onChange={(e) => setSplitUpi(e.target.value.replace(/[^0-9.]/g, ''))}
                                    placeholder="0.00"
                                    className="w-full bg-transparent border-none p-0 text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-0 mt-0.5"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-between items-center text-[10px] pt-1 font-semibold text-slate-500 border-t border-slate-100 dark:border-slate-900 mt-1">
                                <span>Paid: <span className="font-bold text-slate-900 dark:text-white">₹{splitTotalPaid.toFixed(2)}</span></span>
                                <span>Remaining: <span className="font-black text-slate-900 dark:text-white">₹{splitRemaining.toFixed(2)}</span></span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Confirm Settle Button */}
                      <button
                        type="button"
                        onClick={handleConfirmSettle}
                        disabled={isProcessing || (paymentMethod === 'SPLIT' && splitRemaining > 0.01) || paymentMethod === 'UPI' || (paymentMethod === 'CARD' && cardState !== 'APPROVED')}
                        className={\`w-full text-white font-bold py-3.5 px-4 rounded-xl cursor-pointer shadow-xs transition-all uppercase tracking-wider text-xs text-center shrink-0 \${
                          isProcessing || (paymentMethod === 'SPLIT' && splitRemaining > 0.01) || paymentMethod === 'UPI' || (paymentMethod === 'CARD' && cardState !== 'APPROVED')
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border-none'
                            : 'bg-emerald-600 hover:bg-emerald-700'
                        }\`}
                      >
                        {isProcessing ? 'Processing Payment...' : paymentMethod === 'CASH' ? 'Complete Cash Payment' : paymentMethod === 'CARD' ? 'Complete Card Payment' : 'Complete Settle & Release'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}`;

// Replace in file
const startToken = '{/* MODAL 2: GENERATE BILL / SETTLEMENT MODAL */}';
const endToken = '      {/* MODAL 3: VIEW COMPLETED TRANSACTION INVOICE */}';

const startIndex = content.indexOf(startToken);
const endIndex = content.indexOf(endToken);

if (startIndex === -1 || endIndex === -1) {
  console.error("Tokens not found!", { startIndex, endIndex });
  process.exit(1);
}

const before = content.substring(0, startIndex);
const after = content.substring(endIndex);

const updatedContent = before + newModalCode + '\n\n' + after;
fs.writeFileSync(targetFilePath, updatedContent, 'utf8');
console.log("Modal 2 replaced successfully!");
