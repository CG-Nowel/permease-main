<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PromissoryRequest;
use App\Models\Student;
use App\Models\StudentBillingStatus;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PromissoryController extends Controller
{
    /**
     * List all promissory requests, with optional status filter.
     */
    public function index(Request $request): JsonResponse
    {
        $query = PromissoryRequest::with(['student.billingStatus', 'requestedBy', 'approvedBy'])->latest();

        if ($request->has('status') && $request->status !== 'ALL') {
            $query->where('status', strtoupper($request->status));
        }

        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        $requests = $query->get()->map(function ($p) {
            $student = $p->student;
            $billing = $student ? $student->billingStatus : null;

            return [
                'id' => $p->id,
                'request_number' => $p->request_number,
                'student_id' => $p->student_id,
                'student_number' => $student ? $student->student_number : 'N/A',
                'student_name' => $student ? "{$student->first_name} {$student->last_name}" : 'Unknown',
                'course_program' => $student ? "{$student->course} {$student->program}" : '',
                'year_section' => $student ? "{$student->grade_year_level} - {$student->section}" : '',
                'exam_period' => $p->exam_period ?? 'Midterms',
                'academic_year' => $student ? $student->academic_year : '2026-2027',
                'semester' => $student ? $student->semester : '1st Sem',
                'current_balance' => $billing ? (float) $billing->current_balance : (float) $p->remaining_balance,
                'amount_payable_now' => (float) $p->initial_payment,
                'promissory_amount' => (float) $p->initial_payment,
                'amount_paid' => (float) $p->amount_paid,
                'reason' => $p->reason,
                'promise_to_pay_date' => $p->promise_to_pay_date ? $p->promise_to_pay_date->format('Y-m-d') : null,
                'guarantor_name' => $p->guarantor_name ?? '',
                'guarantor_contact' => $p->guarantor_contact ?? '',
                'guarantor_relationship' => $p->guarantor_relationship ?? '',
                'requested_by' => $p->requestedBy ? $p->requestedBy->name : 'Registrar Staff',
                'registrar_notes' => $p->remarks ?? '',
                'status' => $p->status,
                'official_receipt_number' => $p->official_receipt_number,
                'accounting_notes' => $p->accounting_remarks,
                'approved_by' => $p->approvedBy ? $p->approvedBy->name : null,
                'settled_at' => $p->approved_at ? $p->approved_at->format('Y-m-d H:i:s') : null,
                'created_at' => $p->created_at->format('Y-m-d H:i:s'),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $requests,
        ]);
    }

    /**
     * File a new promissory note request (by Registrar).
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'student_id' => ['required', 'exists:students,id'],
            'initial_payment' => ['nullable', 'numeric', 'min:0'],
            'reason' => ['required', 'string', 'max:255'],
            'remarks' => ['nullable', 'string'],
            'exam_period' => ['nullable', 'string', 'max:50'],
            'promise_to_pay_date' => ['nullable', 'date'],
            'guarantor_name' => ['nullable', 'string', 'max:100'],
            'guarantor_contact' => ['nullable', 'string', 'max:50'],
            'guarantor_relationship' => ['nullable', 'string', 'max:50'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $student = Student::with('billingStatus')->findOrFail($request->student_id);
        $billing = $student->billingStatus;

        if (!$billing) {
            return response()->json([
                'success' => false,
                'message' => 'Student does not have an active billing record.',
            ], 422);
        }

        // Check for existing pending request
        $existingPending = PromissoryRequest::where('student_id', $student->id)
            ->where('status', 'PENDING')
            ->first();

        if ($existingPending) {
            return response()->json([
                'success' => false,
                'message' => "Student already has an active pending promissory request ({$existingPending->request_number}).",
            ], 422);
        }

        $initialPayment = (float) $request->input('initial_payment', 0.0);
        $remainingBalance = max(0, (float) $billing->current_balance - $initialPayment);

        // Generate unique request number: PN-2026-XXXX
        $count = PromissoryRequest::count() + 1;
        $requestNumber = 'PN-2026-' . str_pad($count, 4, '0', STR_PAD_LEFT);

        // Get currently authenticated staff user or default to first Registrar user
        $staffUser = $request->user() ?? User::where('role', 'REGISTRAR')->first() ?? User::first();

        $promissory = PromissoryRequest::create([
            'billing_status_id' => $billing->id,
            'student_id' => $student->id,
            'request_number' => $requestNumber,
            'initial_payment' => $initialPayment,
            'remaining_balance' => $remainingBalance,
            'reason' => $request->input('reason'),
            'remarks' => $request->input('remarks'),
            'exam_period' => $request->input('exam_period', 'Midterms'),
            'promise_to_pay_date' => $request->input('promise_to_pay_date'),
            'guarantor_name' => $request->input('guarantor_name'),
            'guarantor_contact' => $request->input('guarantor_contact'),
            'guarantor_relationship' => $request->input('guarantor_relationship'),
            'status' => 'PENDING',
            'requested_by_user_id' => $staffUser ? $staffUser->id : null,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Promissory note {$requestNumber} filed successfully. Forwarded to Accounting for clearance.",
            'data' => [
                'id' => $promissory->id,
                'request_number' => $promissory->request_number,
                'student_id' => $student->id,
                'student_number' => $student->student_number,
                'student_name' => "{$student->first_name} {$student->last_name}",
                'course_program' => "{$student->course} {$student->program}",
                'year_section' => "{$student->grade_year_level} - {$student->section}",
                'exam_period' => $promissory->exam_period,
                'academic_year' => $student->academic_year,
                'semester' => $student->semester,
                'current_balance' => (float) $billing->current_balance,
                'amount_payable_now' => (float) $promissory->initial_payment,
                'promissory_amount' => (float) $promissory->initial_payment,
                'reason' => $promissory->reason,
                'status' => 'PENDING',
                'created_at' => $promissory->created_at->format('Y-m-d H:i:s'),
            ],
        ], 201);
    }

    /**
     * Show single promissory note.
     */
    public function show(string $identifier): JsonResponse
    {
        $promissory = PromissoryRequest::with(['student.billingStatus', 'requestedBy', 'approvedBy'])
            ->where('id', $identifier)
            ->orWhere('request_number', $identifier)
            ->first();

        if (!$promissory) {
            return response()->json([
                'success' => false,
                'message' => 'Promissory request not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $promissory,
        ]);
    }

    /**
     * Approve a promissory note and unlock test permit (by Accounting).
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'official_receipt_number' => ['required', 'string', 'max:64'],
            'amount_paid' => ['required', 'numeric', 'min:0'],
            'accounting_remarks' => ['nullable', 'string'],
        ], [
            'official_receipt_number.required' => 'Official Receipt (OR) Number is required to validate payment.',
            'amount_paid.required' => 'Please enter the initial downpayment amount received.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $promissory = PromissoryRequest::with(['student.billingStatus'])->findOrFail($id);

        if ($promissory->status !== 'PENDING') {
            return response()->json([
                'success' => false,
                'message' => "Promissory request {$promissory->request_number} has already been {$promissory->status}.",
            ], 422);
        }

        $student = $promissory->student;
        $billing = $student ? $student->billingStatus : null;

        if (!$student || !$billing) {
            return response()->json([
                'success' => false,
                'message' => 'Associated student billing profile was not found.',
            ], 404);
        }

        $amountPaid = (float) $request->amount_paid;
        $orNumber = trim($request->official_receipt_number);
        $notes = $request->input('accounting_remarks', 'Promissory note approved. Billing cleared for test permit release.');

        // Current accounting user
        $cashierUser = $request->user() ?? User::where('role', 'ACCOUNTING')->first() ?? User::first();

        DB::transaction(function () use ($promissory, $billing, $amountPaid, $orNumber, $notes, $cashierUser) {
            // 1. Update Promissory record
            $promissory->update([
                'status' => 'APPROVED',
                'official_receipt_number' => $orNumber,
                'amount_paid' => $amountPaid,
                'accounting_remarks' => $notes,
                'approved_by_user_id' => $cashierUser ? $cashierUser->id : null,
                'approved_at' => now(),
            ]);

            // 2. Clear Billing and Unlock Test Permit in database!
            $newPaid = (float) $billing->total_paid + $amountPaid;
            $newBalance = max(0, (float) $billing->current_balance - $amountPaid);

            $billing->update([
                'total_paid' => $newPaid,
                'current_balance' => $newBalance,
                'billing_status' => 'CLEARED',
                'exam_permit_status' => 'AVAILABLE', // Test permit is unlocked for Kiosk printing!
                'last_cleared_at' => now(),
            ]);
        });

        $promissory->load(['student.billingStatus', 'approvedBy']);

        return response()->json([
            'success' => true,
            'message' => "Promissory Note {$promissory->request_number} approved! Billing cleared and exam permit unlocked for {$student->first_name} {$student->last_name}.",
            'data' => [
                'request' => $promissory,
                'student' => $student->load('billingStatus'),
            ],
        ]);
    }

    /**
     * Reject a promissory note.
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'reason' => ['required', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $promissory = PromissoryRequest::findOrFail($id);

        if ($promissory->status !== 'PENDING') {
            return response()->json([
                'success' => false,
                'message' => "Request is already {$promissory->status}.",
            ], 422);
        }

        $user = $request->user() ?? User::where('role', 'ACCOUNTING')->first() ?? User::first();

        $promissory->update([
            'status' => 'REJECTED',
            'accounting_remarks' => $request->reason,
            'approved_by_user_id' => $user ? $user->id : null,
            'approved_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Promissory note {$promissory->request_number} was rejected.",
            'data' => $promissory,
        ]);
    }
}
