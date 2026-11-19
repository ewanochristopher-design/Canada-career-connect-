import React, { useState } from 'react';
import { Calendar, CheckCircle2, CreditCard, Loader2, Smartphone, X } from 'lucide-react';
import { apiFetch } from '../lib/api.ts';
import type { PaymentRecord, PublicUser, ServiceItem } from '../types.ts';

interface CheckoutModalProps {
  service: ServiceItem;
  user: PublicUser;
  cadToKesRate: number;
  onClose: () => void;
  onPaid: (payment: PaymentRecord) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  service,
  user,
  cadToKesRate,
  onClose,
  onPaid,
}) => {
  const [gateway, setGateway] = useState<'mpesa' | 'stripe'>('mpesa');
  const [phoneNumber, setPhoneNumber] = useState(user.phone || '0712345678');
  const [cardholderName, setCardholderName] = useState(user.fullName);
  const [cardLast4, setCardLast4] = useState('4242');
  const [cardBrand, setCardBrand] = useState('Visa');
  const [scheduledDate, setScheduledDate] = useState('2026-11-28');
  const [scheduledTime, setScheduledTime] = useState('14:00');
  const [timezone, setTimezone] = useState('EAT (Nairobi, UTC+3)');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<PaymentRecord | null>(null);
  const [gatewayMsg, setGatewayMsg] = useState('');

  const amountKes = Math.round(service.priceCad * cadToKesRate);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const consultationMeta =
        service.category === 'consultation'
          ? { scheduledDate, scheduledTime, timezone, notes }
          : undefined;

      if (gateway === 'mpesa') {
        const res = await apiFetch<{ payment: PaymentRecord; message: string }>(
          '/api/payments/mpesa',
          {
            method: 'POST',
            body: JSON.stringify({
              serviceId: service.id,
              phoneNumber,
              consultationMeta,
            }),
          }
        );
        setReceipt(res.payment);
        setGatewayMsg(res.message);
        onPaid(res.payment);
      } else {
        const res = await apiFetch<{ payment: PaymentRecord; message: string }>(
          '/api/payments/stripe',
          {
            method: 'POST',
            body: JSON.stringify({
              serviceId: service.id,
              cardLast4,
              cardBrand,
              cardholderName,
              consultationMeta,
            }),
          }
        );
        setReceipt(res.payment);
        setGatewayMsg(res.message);
        onPaid(res.payment);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071B33]/65 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#D62839]">
              Transparent Service Checkout
            </span>
            <h2 className="mt-0.5 font-display text-lg font-extrabold text-[#071B33]">
              {service.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <div className="text-xs text-slate-500">Service Total</div>
            <div className="font-mono text-lg font-extrabold text-[#071B33]">
              CAD ${service.priceCad}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">KES Equivalent (1 CAD = {cadToKesRate} KES)</div>
            <div className="font-mono text-base font-bold text-emerald-700">
              KES {amountKes.toLocaleString()}
            </div>
          </div>
        </div>

        {receipt ? (
          <div className="mt-5 space-y-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 font-display text-base font-extrabold text-emerald-900">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Payment Confirmed!
            </div>
            <p className="text-xs text-emerald-800">{gatewayMsg}</p>
            <div className="space-y-1 rounded-lg bg-white p-3 font-mono text-xs text-slate-700">
              <div>Receipt: {receipt.receiptNumber}</div>
              <div>Service: {receipt.serviceName}</div>
              <div>
                Paid: {receipt.currency === 'KES' ? `KES ${receipt.amountKes.toLocaleString()}` : `CAD $${receipt.amountCad}`}
              </div>
              <div>Details: {receipt.paymentDetails}</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-[#071B33] py-2.5 text-sm font-bold text-white hover:bg-[#0D2C54]"
            >
              Done &amp; Return to Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handlePay} className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGateway('mpesa')}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
                  gateway === 'mpesa'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <Smartphone className="h-4 w-4" />
                M-Pesa STK (KES)
              </button>
              <button
                type="button"
                onClick={() => setGateway('stripe')}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
                  gateway === 'stripe'
                    ? 'border-[#071B33] bg-[#071B33] text-white'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                Stripe Card (CAD)
              </button>
            </div>

            {service.category === 'consultation' && (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#071B33]">
                  <Calendar className="h-4 w-4 text-[#D62839]" />
                  Select Consultation Slot
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                      Time
                    </label>
                    <input
                      type="time"
                      required
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                    Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                  >
                    <option value="EAT (Nairobi, UTC+3)">EAT (Nairobi, UTC+3)</option>
                    <option value="WAT (Lagos/Accra, UTC+1)">WAT (Lagos, UTC+1)</option>
                    <option value="EST (Toronto, UTC-5)">EST (Toronto, UTC-5)</option>
                    <option value="MST (Calgary, UTC-7)">MST (Calgary, UTC-7)</option>
                  </select>
                </div>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Topics you want covered (e.g., Ontario nursing CV, Class 1 license)..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                />
              </div>
            )}

            {gateway === 'mpesa' ? (
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  M-Pesa Phone Number (Kenya)
                </label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0712345678 or 254712345678"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm focus:border-[#071B33] focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Charges KES {amountKes.toLocaleString()} via Daraja STK Push / Sandbox verification.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    required
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Card Brand
                    </label>
                    <select
                      value={cardBrand}
                      onChange={(e) => setCardBrand(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    >
                      <option value="Visa">Visa</option>
                      <option value="Mastercard">Mastercard</option>
                      <option value="Amex">Amex</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Last 4 Digits
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      required
                      value={cardLast4}
                      onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, ''))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D62839] py-3 text-sm font-bold text-white shadow-sm hover:bg-[#B81F2E] disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>
                {gateway === 'mpesa'
                  ? `Pay KES ${amountKes.toLocaleString()} via M-Pesa`
                  : `Pay CAD $${service.priceCad} via Stripe`}
              </span>
            </button>

            <p className="text-center text-[11px] text-slate-500">
              Fee covers career preparation/advisory only — does not guarantee employment or IRCC visa approval.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
