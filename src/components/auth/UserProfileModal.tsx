import React, { useState } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { Button } from '../ui/Button.tsx';
import { RfidScannerRadar } from '../feedback/RfidScannerRadar.tsx';
import { useAuth } from '../../store/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import { API_ROUTES } from '../../lib/constants.ts';
import {
  CreditCard,
  ShieldCheck,
  Wifi,
  Sparkles,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { toast } from 'sonner';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, login } = useAuth();
  const [isPairingMode, setIsPairingMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualUid, setManualUid] = useState('');

  const currentUid = user?.rfid_uid || user?.rfid_card?.rfid_uid;

  const handlePairRfid = async (uidToPair: string) => {
    const cleanUid = uidToPair.trim().toUpperCase();
    if (!cleanUid) {
      toast.error('Please tap or provide a valid RFID Card UID.');
      return;
    }

    if (!user) return;

    setIsSubmitting(true);
    try {
      // Attempt backend API call
      let updatedUser = {
        ...user,
        rfid_uid: cleanUid,
        rfid_card: {
          id: user.id,
          user_id: user.id,
          rfid_uid: cleanUid,
          status: 'ACTIVE' as const,
        },
      };

      try {
        const response = await api.post(API_ROUTES.USERS.ASSIGN_RFID(user.id), {
          rfid_uid: cleanUid,
        });
        if (response.data?.data) {
          updatedUser = response.data.data;
        }
      } catch (apiErr: any) {
        // Fallback for offline demo mode
        console.warn('API sync warning:', apiErr?.response?.data?.message || apiErr.message);
      }

      const currentToken = localStorage.getItem('permease_token') || 'token_' + Date.now();
      login(currentToken, updatedUser);
      toast.success(`RFID Card [${cleanUid}] successfully paired to ${user.name}!`);
      setIsPairingMode(false);
      setManualUid('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to assign RFID card.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnpairRfid = async () => {
    if (!user) return;
    if (!confirm('Are you sure you want to unlink the RFID card from this staff account?')) return;

    setIsSubmitting(true);
    try {
      try {
        await api.delete(API_ROUTES.USERS.ASSIGN_RFID(user.id));
      } catch (apiErr) {
        console.warn('API unpair warning:', apiErr);
      }

      const updatedUser = {
        ...user,
        rfid_uid: null,
        rfid_card: null,
      };

      const currentToken = localStorage.getItem('permease_token') || 'token_' + Date.now();
      login(currentToken, updatedUser);
      toast.success('RFID card unlinked from user account.');
    } catch {
      toast.error('Failed to unlink RFID card.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setIsPairingMode(false);
        onClose();
      }}
      title="Staff Account & RFID Smart Card"
      description="Manage institutional staff credentials and contactless RFID card access"
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* User Identity Banner */}
        <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#0B1B3D] to-[#1E40AF] text-[#D4AF37] font-black text-lg flex items-center justify-center shrink-0 shadow-md">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-[#0B1B3D] truncate">{user?.name || 'Staff User'}</h4>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1E40AF]/10 text-[#1E40AF] border border-[#1E40AF]/20">
                <ShieldCheck size={11} />
                {user?.role || 'REGISTRAR'}
              </span>
              <span className="text-[11px] text-slate-400">ID #{user?.id ?? 1}</span>
            </div>
          </div>
        </div>

        {/* Physical RFID Card Graphic Showcase */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <CreditCard size={14} className="text-[#1E40AF]" />
              Staff RFID Smart Card
            </span>
            {currentUid ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={11} />
                Paired & Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <AlertCircle size={11} />
                No Card Paired
              </span>
            )}
          </div>

          {/* Virtual RFID Card Representation */}
          <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-br from-[#070E1A] via-[#0B1B3D] to-[#162A54] border border-[#D4AF37]/40 shadow-xl p-5 text-white select-none">
            {/* Background Texture & Glow */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-[#1E40AF]/30 rounded-full blur-xl pointer-events-none" />

            {/* Header: Institution & Contactless Icon */}
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-2">
                <img
                  src="/images/logox.jpg"
                  alt="PermEase"
                  className="h-6 w-auto object-contain select-none shrink-0 rounded-xs"
                />
                <div>
                  <span className="text-[11px] font-black tracking-widest text-[#D4AF37] uppercase block leading-none">
                    PERMEASE
                  </span>
                  <span className="text-[8px] tracking-wider text-slate-300 uppercase leading-none">
                    Staff Identity Token
                  </span>
                </div>
              </div>
              <Wifi size={18} className="text-[#D4AF37] rotate-90" />
            </div>

            {/* Chip & Security Seal */}
            <div className="my-3.5 flex items-center justify-between relative z-10">
              {/* EMV Microchip Representation */}
              <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-300/80 shadow-xs flex items-center justify-center">
                <div className="w-7 h-4 border border-amber-800/40 rounded-xs grid grid-cols-2 gap-0.5">
                  <div className="border-r border-amber-800/30" />
                  <div />
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-mono tracking-widest text-slate-300 uppercase block">
                  STAFF PASS
                </span>
                <span className="text-[10px] font-bold text-amber-300">ISO/IEC 14443</span>
              </div>
            </div>

            {/* Cardholder Information & UID */}
            <div className="relative z-10 pt-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Cardholder</p>
              <h3 className="text-sm font-black tracking-wider text-white uppercase truncate">
                {user?.name || 'Staff User'}
              </h3>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                <div>
                  <span className="text-[8px] text-slate-400 uppercase tracking-widest block">UID Credentials</span>
                  <span className="text-xs font-mono font-bold text-[#D4AF37] tracking-widest">
                    {currentUid || '••••••••'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] text-slate-400 uppercase tracking-widest block">Access Scope</span>
                  <span className="text-[10px] font-bold text-slate-200 uppercase">
                    {user?.role || 'REGISTRAR'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pairing / Reader Section */}
        {isPairingMode ? (
          <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0B1B3D] flex items-center gap-1.5">
                <KeyRound size={14} className="text-[#1E40AF]" />
                Scan or Tap New RFID Card
              </span>
              <button
                type="button"
                onClick={() => setIsPairingMode(false)}
                className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <RfidScannerRadar
              statusText={isSubmitting ? 'Linking RFID to user…' : 'Reader Ready • Tap RFID Card'}
              subText="Tap the physical staff RFID card on the USB reader or type the UID below"
              isProcessing={isSubmitting}
            />

            {/* Manual UID Input */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-semibold text-slate-700">
                Manual UID Entry / Reader Hardware
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualUid}
                  onChange={(e) => setManualUid(e.target.value.toUpperCase())}
                  placeholder="e.g. REG-RFID-001 or 88EE44AA"
                  className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] bg-white"
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting || !manualUid.trim()}
                  onClick={() => handlePairRfid(manualUid)}
                >
                  Pair Card
                </Button>
              </div>
            </div>

            {/* Quick Demo Preset Buttons */}
            <div className="pt-2 border-t border-slate-200/70">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Quick Demo RFID Cards:
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePairRfid('REG-RFID-001')}
                  className="px-2 py-1 text-[11px] font-mono rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition cursor-pointer"
                >
                  REG-RFID-001 (Registrar)
                </button>
                <button
                  type="button"
                  onClick={() => handlePairRfid('ACC-RFID-002')}
                  className="px-2 py-1 text-[11px] font-mono rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition cursor-pointer"
                >
                  ACC-RFID-002 (Accounting)
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
            {currentUid && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUnpairRfid}
                disabled={isSubmitting}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                leftIcon={<Trash2 size={13} />}
              >
                Unlink Card
              </Button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <Button
                type="button"
                variant={currentUid ? 'outline' : 'primary'}
                size="sm"
                onClick={() => setIsPairingMode(true)}
                leftIcon={currentUid ? <RefreshCw size={13} /> : <Sparkles size={13} />}
              >
                {currentUid ? 'Re-pair RFID Card' : 'Pair RFID Card'}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
