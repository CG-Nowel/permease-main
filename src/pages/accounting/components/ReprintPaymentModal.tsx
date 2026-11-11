import React, { useState } from 'react';
import { Modal, Input, Button } from '../../../components/index.ts';
import { Receipt, CheckCircle2 } from 'lucide-react';

export interface ReprintPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName?: string;
  studentNumber?: string;
  permitNumber?: string;
  onConfirm: (data: { amount: number; referenceNumber: string; notes: string }) => void;
}

export const ReprintPaymentModal: React.FC<ReprintPaymentModalProps> = ({
  isOpen,
  onClose,
  studentName = 'Student',
  studentNumber = '2026-00000',
  permitNumber = 'TP-2026-000000',
  onConfirm,
}) => {
  const [amount, setAmount] = useState('50.00');
  const [referenceNumber, setReferenceNumber] = useState('OR-2026-' + Math.floor(10000 + Math.random() * 90000));
  const [notes, setNotes] = useState('Reprint fee processed');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      amount: parseFloat(amount) || 50.0,
      referenceNumber,
      notes,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Authorize Test Permit Reprint"
      description="Record official receipt and authorize exactly ONE additional kiosk reprint"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <span className="text-slate-400 block font-semibold uppercase">Student Profile</span>
          <span className="font-bold text-slate-800 text-sm">{studentName} ({studentNumber})</span>
          <span className="block text-slate-500 mt-0.5">Permit Record: {permitNumber}</span>
        </div>

        <Input
          label="Reprint Fee Amount (PHP) *"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <Input
          label="Official Receipt / Reference No. *"
          placeholder="e.g. OR-2026-90412"
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
          leftIcon={<Receipt size={16} />}
          required
        />

        <Input
          label="Cashier Remarks"
          placeholder="e.g. Replacement for damaged permit"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="pt-2 flex justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="gold" leftIcon={<CheckCircle2 size={16} />}>
            Confirm Payment & Authorize
          </Button>
        </div>
      </form>
    </Modal>
  );
};
