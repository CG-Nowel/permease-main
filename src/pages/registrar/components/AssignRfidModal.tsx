import React, { useState } from 'react';
import { Modal, RfidScannerRadar, Button } from '../../../components/index.ts';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export interface AssignRfidModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  studentNumber: string;
  onSuccess: (rfidUid: string) => void;
}

export const AssignRfidModal: React.FC<AssignRfidModalProps> = ({
  isOpen,
  onClose,
  studentName,
  studentNumber,
  onSuccess,
}) => {
  const [isScanning, setIsScanning] = useState(true);
  const [collisionError, setCollisionError] = useState<string | null>(null);
  const [scannedUid, setScannedUid] = useState<string | null>(null);

  const handleSimulateTap = (uid: string) => {
    setIsScanning(false);

    // Collision check demonstration
    if (uid === 'E4A28B10') {
      setCollisionError('This RFID card is already assigned to another student (Juan Dela Cruz - 2026-00001).');
      toast.error('RFID collision detected');
      return;
    }

    setCollisionError(null);
    setScannedUid(uid);
    toast.success('RFID card paired successfully!');
    onSuccess(uid);
  };

  const handleClose = () => {
    setIsScanning(true);
    setCollisionError(null);
    setScannedUid(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Assign RFID Smart Card"
      description="Touchless card assignment for student enrollment"
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Candidate Student</p>
          <h4 className="text-base font-black text-[#0B1B3D]">{studentName}</h4>
          <p className="text-xs font-mono text-[#1E40AF] mt-0.5">Student No: {studentNumber}</p>
        </div>

        {!scannedUid ? (
          <div>
            <RfidScannerRadar
              statusText={isScanning ? 'Waiting for RFID card...' : 'Processing Card...'}
              subText="Please tap the student's RFID card on the reader"
              isProcessing={isScanning}
            />

            {collisionError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 mb-4">
                <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600" />
                <span>{collisionError}</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 text-center">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Simulate Hardware Reader Input
              </p>
              <div className="flex justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSimulateTap('88EE44AA')}
                >
                  Clean Tag (88EE44AA)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSimulateTap('E4A28B10')}
                >
                  Duplicate Tag (Conflict)
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-[#0B1B3D]">RFID Successfully Registered</h4>
              <p className="text-xs text-slate-500 mt-1">
                The student account is officially active and ready for test permit issuance
              </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 max-w-sm mx-auto text-left space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-800">{studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Student No:</span>
                <span className="font-mono font-bold text-slate-800">{studentNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned RFID UID:</span>
                <span className="font-mono font-bold text-emerald-700">{scannedUid}</span>
              </div>
            </div>

            <Button variant="gold" size="md" onClick={handleClose}>
              Done & Complete Registration
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
