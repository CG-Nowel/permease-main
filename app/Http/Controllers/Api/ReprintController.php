<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReprintRequest;
use App\Models\Student;
use App\Models\StudentBillingStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ReprintController extends Controller
{
    /**
     * List all reprint requests / payments.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ReprintRequest::with(['student.billingStatus', 'processedBy'])->latest();

        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->has('status') && $request->status !== 'ALL') {
            $query->where('payment_status', strtoupper($request->status));
        }

        $records = $query->get()->map(function ($r) {
            $student = $r->student;
            $cashier = $r->processedBy ? $r->processedBy->name : 'Accounting Office';

            return [
                'id' => $r->id,
                'student_id' => $r->student_id,
                'student_number' => $student ? $student->student_number : 'N/A',
                'student_name' => $student ? "{$student->first_name} {$student->last_name}" : 'Unknown',
                'test_permit_id' => $student ? $student->id : 1,
                'permit_number' => $student ? 'TP-2026-' . str_pad($student->id, 6, '0', STR_PAD_LEFT) : 'N/A',
                'amount' => (float) $r->reprint_fee,
                'reference_number' => $r->reference_number,
                'official_receipt_number' => $r->official_receipt_number,
                'status' => $r->payment_status ?? 'PAID',
                'reprint_status' => $r->reprint_status ?? 'AUTHORIZED',
                'cashier_name' => $cashier,
                'paid_at' => $r->created_at ? $r->created_at->format('Y-m-d H:i:s') : null,
                'consumed_at' => $r->printed_at ? $r->printed_at->format('Y-m-d H:i:s') : null,
                'remarks' => $r->remarks ?? '',
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $records,
        ]);
    }

    /**
     * Authorize a new examination permit reprint fee payment.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'student_id' => ['required', 'exists:students,id'],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'reprint_fee' => ['nullable', 'numeric', 'min:0'],
            'reference_number' => ['required', 'string', 'max:64', 'unique:reprint_requests,reference_number'],
            'remarks' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:255'],
            'cashier_name' => ['nullable', 'string', 'max:150'],
        ], [
            'reference_number.unique' => 'This receipt / reference number has already been recorded.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();
        $student = Student::with('billingStatus')->findOrFail($validated['student_id']);

        $amount = isset($validated['amount']) ? (float)$validated['amount'] : (isset($validated['reprint_fee']) ? (float)$validated['reprint_fee'] : 50.00);
        $remarks = $validated['notes'] ?? ($validated['remarks'] ?? 'Lost or damaged permit reprint fee');

        try {
            $reprint = DB::transaction(function () use ($student, $validated, $amount, $remarks) {
                $billingId = $student->billing_status_id;
                if (!$billingId && $student->billingStatus) {
                    $billingId = $student->billingStatus->id;
                }

                if (!$billingId) {
                    $billing = StudentBillingStatus::create([
                        'student_id' => $student->id,
                        'total_assessment' => 15500.00,
                        'current_balance' => 0.00,
                        'total_paid' => 15500.00,
                        'billing_status' => 'CLEARED',
                        'exam_permit_status' => 'PRINTED',
                    ]);
                    $billingId = $billing->id;
                    $student->update(['billing_status_id' => $billingId]);
                } elseif ($student->billingStatus && $student->billingStatus->billing_status === 'CLEARED') {
                    $student->billingStatus->update([
                        'exam_permit_status' => 'PRINTED',
                    ]);
                }

                return ReprintRequest::create([
                    'billing_status_id' => $billingId,
                    'student_id' => $student->id,
                    'reference_number' => $validated['reference_number'],
                    'official_receipt_number' => $validated['reference_number'],
                    'reprint_fee' => $amount,
                    'payment_status' => 'PAID',
                    'reprint_status' => 'AUTHORIZED',
                    'processed_by_user_id' => auth()->id() ?? 2,
                    'printed_at' => null,
                ]);
            });

            $reprint->load(['student', 'processedBy']);
            $cashier = $reprint->processedBy ? $reprint->processedBy->name : ($validated['cashier_name'] ?? 'Accounting Office');

            return response()->json([
                'success' => true,
                'message' => 'Reprint payment successfully recorded and permit authorized!',
                'data' => [
                    'id' => $reprint->id,
                    'student_id' => $reprint->student_id,
                    'student_number' => $student->student_number,
                    'student_name' => "{$student->first_name} {$student->last_name}",
                    'test_permit_id' => $student->id,
                    'permit_number' => 'TP-2026-' . str_pad($student->id, 6, '0', STR_PAD_LEFT),
                    'amount' => (float) $reprint->reprint_fee,
                    'reference_number' => $reprint->reference_number,
                    'official_receipt_number' => $reprint->official_receipt_number,
                    'status' => 'PAID',
                    'reprint_status' => 'AUTHORIZED',
                    'cashier_name' => $cashier,
                    'paid_at' => $reprint->created_at->format('Y-m-d H:i:s'),
                    'consumed_at' => null,
                    'remarks' => $remarks,
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to record reprint payment: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mark reprint token as consumed/printed.
     */
    public function consume(string $id): JsonResponse
    {
        $reprint = ReprintRequest::where('id', $id)
            ->orWhere('reference_number', $id)
            ->first();

        if (!$reprint) {
            return response()->json([
                'success' => false,
                'message' => 'Reprint request not found.',
            ], 404);
        }

        $reprint->update([
            'payment_status' => 'CONSUMED',
            'reprint_status' => 'USED',
            'printed_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Reprint token marked as consumed.',
            'data' => $reprint,
        ]);
    }
}
