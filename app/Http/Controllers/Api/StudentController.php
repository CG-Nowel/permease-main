<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\FinancialStatusHistory;
use App\Models\ReprintRequest;
use App\Models\Student;
use App\Models\StudentBillingStatus;
use App\Models\StudentSubject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class StudentController extends Controller
{
    /**
     * Format a Student model with live billing, permit, and reprint authorization status.
     */
    private function formatStudentPayload(Student $student, ?string $defaultAy = null, ?string $defaultSem = null): array
    {
        $student->loadMissing(['billingStatus', 'subjects', 'reprintRequests']);

        $billing = $student->billingStatus;
        $units = $student->subjects->sum('units');
        $isCleared = $billing && $billing->billing_status === 'CLEARED';

        $activeReprint = $student->reprintRequests
            ->where('reprint_status', 'AUTHORIZED')
            ->whereNull('printed_at')
            ->sortByDesc('id')
            ->first();

        $consumedReprints = $student->reprintRequests
            ->where('reprint_status', 'USED')
            ->count();

        $permitStatus = 'BLOCKED';
        if ($isCleared) {
            $permitStatus = ($billing->exam_permit_status === 'PRINTED') ? 'PRINTED' : 'AVAILABLE';
        }

        $printCount = ($permitStatus === 'PRINTED' ? 1 : 0) + $consumedReprints;
        $reprintAllowed = $isCleared && $activeReprint !== null;

        return [
            'id' => $student->id,
            'student_number' => $student->student_number,
            'first_name' => $student->first_name,
            'middle_name' => $student->middle_name,
            'last_name' => $student->last_name,
            'course' => $student->course,
            'program' => $student->program,
            'grade_year_level' => $student->grade_year_level,
            'section' => $student->section,
            'student_type' => $student->student_type ?? 'Regular',
            'status' => 'ACTIVE',
            'units' => $units > 0 ? $units : 18,
            'balance_amount' => $billing ? (float) $billing->current_balance : 0.0,
            'rfid_card' => $student->rfid_uid ? [
                'id' => $student->id,
                'student_id' => $student->id,
                'rfid_uid' => $student->rfid_uid,
                'status' => 'ACTIVE',
            ] : null,
            'financial_status' => [
                'id' => $billing ? $billing->id : $student->id,
                'student_id' => $student->id,
                'status' => $billing ? $billing->billing_status : 'WITH_BALANCE',
            ],
            'academic_year' => $student->academic_year ?? $defaultAy ?? '2026-2027',
            'semester' => $student->semester ?? $defaultSem ?? '1st Semester',
            'current_permit' => [
                'id' => $student->id,
                'student_id' => $student->id,
                'permit_number' => 'TP-2026-' . str_pad($student->id, 6, '0', STR_PAD_LEFT),
                'academic_year' => $student->academic_year ?? $defaultAy ?? '2026-2027',
                'semester' => $student->semester ?? $defaultSem ?? '1st Semester',
                'exam_period' => $billing ? $billing->current_exam_period : 'Prelim',
                'status' => $permitStatus,
                'print_count' => $printCount,
                'reprint_allowed' => $reprintAllowed,
            ],
            'subjects' => $student->subjects,
        ];
    }

    /**
     * List all students with their billing status and subjects.
     */
    public function index(): JsonResponse
    {
        $activeTerm = AcademicTerm::where('is_active', true)->first();
        $defaultAy = $activeTerm ? $activeTerm->academic_year : '2025–2026';
        $defaultSem = $activeTerm ? $activeTerm->semester : '2nd Sem';

        $students = Student::with(['billingStatus', 'subjects', 'reprintRequests'])->latest()->get();

        $formatted = $students->map(fn ($s) => $this->formatStudentPayload($s, $defaultAy, $defaultSem));

        return response()->json([
            'success' => true,
            'data' => $formatted,
        ]);
    }

    /**
     * Register a new student.
     * All students registered here are assigned billing status 'WITH_BALANCE'
     * and exam permit status 'BLOCKED'.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'first_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'student_number' => ['required', 'string', 'max:32', 'unique:students,student_number'],
            'grade_year_level' => ['required', 'string', 'max:20'],
            'section' => ['required', 'string', 'max:20'],
            'course' => ['required', 'string', 'max:150'],
            'program' => ['required', 'string', 'max:50'],
            'student_type' => ['nullable', 'string', 'in:Regular,Irregular'],
            'rfid_uid' => ['nullable', 'string', 'max:64', 'unique:students,rfid_uid'],
            'semester' => ['nullable', 'string', 'max:30'],
            'academic_year' => ['nullable', 'string', 'max:30'],
            'subjects' => ['nullable', 'array'],
            'subjects.*.code' => ['required', 'string', 'max:30'],
            'subjects.*.title' => ['required', 'string', 'max:150'],
            'subjects.*.units' => ['nullable', 'numeric'],
            'subjects.*.type' => ['nullable', 'string'],
        ], [
            'student_number.unique' => 'Student Number is already assigned to an enrolled student.',
            'rfid_uid.unique' => 'This RFID card is already assigned to another student.',
            'grade_year_level.required' => 'Please select a Year Level before submitting registration.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        try {
            $result = DB::transaction(function () use ($validated, $request) {
                // 1. Calculate subject units and assessment
                $subjects = $request->input('subjects', []);
                $totalUnits = collect($subjects)->sum(function ($s) {
                    return isset($s['units']) ? (int) $s['units'] : 3;
                });

                // Standard tuition model: ₱650 per unit + ₱2,500 base institutional fees
                $unitRate = 650.00;
                $miscFee = 2500.00;
                $totalAssessment = $totalUnits > 0
                    ? ($totalUnits * $unitRate) + $miscFee
                    : 15500.00;

                // 2. Create Student Record
                $activeTerm = AcademicTerm::where('is_active', true)->first();
                $academicYear = !empty($validated['academic_year'])
                    ? $validated['academic_year']
                    : ($activeTerm ? $activeTerm->academic_year : '2025–2026');
                $semester = !empty($validated['semester'])
                    ? $validated['semester']
                    : ($activeTerm ? $activeTerm->semester : '2nd Sem');

                $student = Student::create([
                    'student_number' => $validated['student_number'],
                    'first_name' => $validated['first_name'],
                    'middle_name' => $validated['middle_name'] ?? null,
                    'last_name' => $validated['last_name'],
                    'course' => $validated['course'],
                    'program' => $validated['program'],
                    'grade_year_level' => $validated['grade_year_level'],
                    'section' => $validated['section'],
                    'student_type' => $validated['student_type'] ?? 'Regular',
                    'semester' => $semester,
                    'academic_year' => $academicYear,
                    'rfid_uid' => $validated['rfid_uid'] ?? null,
                    'enrollment_status' => 'ENROLLED',
                ]);

                // 3. Create Central Student Billing Status (Explicitly WITH_BALANCE)
                $billing = StudentBillingStatus::create([
                    'student_id' => $student->id,
                    'total_assessment' => $totalAssessment,
                    'current_balance' => $totalAssessment, // Outstanding balance
                    'total_paid' => 0.00,
                    'billing_status' => 'WITH_BALANCE',    // Requirement: all registered students have WITH_BALANCE
                    'exam_permit_status' => 'BLOCKED',     // Blocked until settled or approved promissory
                    'current_exam_period' => 'Prelim',
                    'last_cleared_at' => null,
                ]);

                // Link back to student
                $student->update(['billing_status_id' => $billing->id]);

                // 4. Enroll subjects for current term
                foreach ($subjects as $s) {
                    StudentSubject::create([
                        'billing_status_id' => $billing->id,
                        'student_id' => $student->id,
                        'subject_code' => $s['code'],
                        'subject_title' => $s['title'],
                        'units' => $s['units'] ?? 3,
                        'subject_type' => $s['type'] ?? 'Major',
                    ]);
                }

                $student->load(['billingStatus', 'subjects']);

                return [
                    'student' => $student,
                    'billing' => $billing,
                    'totalUnits' => $totalUnits,
                ];
            });

            /** @var Student $student */
            $student = $result['student'];
            $formatted = $this->formatStudentPayload($student);

            return response()->json([
                'success' => true,
                'message' => 'Student successfully registered with billing status WITH_BALANCE.',
                'data' => $formatted,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to register student: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a student by ID, student_number, or RFID UID.
     */
    public function show(string $identifier): JsonResponse
    {
        $student = Student::with(['billingStatus', 'subjects', 'reprintRequests'])
            ->where('id', $identifier)
            ->orWhere('student_number', $identifier)
            ->orWhere('rfid_uid', $identifier)
            ->first();

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatStudentPayload($student),
        ]);
    }

    /**
     * Update student details, promote year level, and replace subject load.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $student = Student::with(['billingStatus', 'subjects'])
            ->where('id', $id)
            ->orWhere('student_number', $id)
            ->first();

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'first_name' => ['sometimes', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['sometimes', 'string', 'max:100'],
            'student_number' => ['sometimes', 'string', 'max:32', 'unique:students,student_number,' . $student->id],
            'grade_year_level' => ['sometimes', 'string', 'max:20'],
            'section' => ['sometimes', 'string', 'max:20'],
            'course' => ['sometimes', 'string', 'max:150'],
            'program' => ['sometimes', 'string', 'max:50'],
            'student_type' => ['nullable', 'string', 'in:Regular,Irregular'],
            'rfid_uid' => ['nullable', 'string', 'max:64', 'unique:students,rfid_uid,' . $student->id],
            'semester' => ['nullable', 'string', 'max:30'],
            'academic_year' => ['nullable', 'string', 'max:30'],
            'subjects' => ['nullable', 'array'],
            'subjects.*.code' => ['required_with:subjects', 'string', 'max:30'],
            'subjects.*.title' => ['required_with:subjects', 'string', 'max:150'],
            'subjects.*.units' => ['nullable', 'numeric'],
            'subjects.*.type' => ['nullable', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        try {
            DB::transaction(function () use ($student, $validated, $request) {
                // Update basic student information
                $studentData = collect($validated)->except('subjects')->filter(function ($val) {
                    return $val !== null;
                })->toArray();

                $student->update($studentData);

                // If subjects are passed, delete old subjects and save the new subject load
                if ($request->has('subjects')) {
                    StudentSubject::where('student_id', $student->id)->delete();

                    $billingId = $student->billing_status_id ?? ($student->billingStatus ? $student->billingStatus->id : null);
                    $subjects = $request->input('subjects', []);

                    foreach ($subjects as $s) {
                        $units = isset($s['units']) ? (int) $s['units'] : 3;

                        StudentSubject::create([
                            'billing_status_id' => $billingId,
                            'student_id' => $student->id,
                            'subject_code' => $s['code'],
                            'subject_title' => $s['title'],
                            'units' => $units,
                            'subject_type' => $s['type'] ?? 'Major',
                        ]);
                    }
                }
            });

            $student->load(['billingStatus', 'subjects', 'reprintRequests']);

            return response()->json([
                'success' => true,
                'message' => 'Student record and subjects successfully updated.',
                'data' => $this->formatStudentPayload($student),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update student: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update student's financial clearance status and log the audit trail.
     */
    public function updateBillingStatus(Request $request, string $id): JsonResponse
    {
        $student = Student::with(['billingStatus', 'subjects'])
            ->where('id', $id)
            ->orWhere('student_number', $id)
            ->first();

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'status' => ['required', 'string', 'in:WITH_BALANCE,CLEARED'],
            'notes' => ['nullable', 'string', 'max:500'],
            'operator_name' => ['nullable', 'string', 'max:150'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $newStatus = $request->input('status');
        $notes = $request->input('notes') ?? ($newStatus === 'CLEARED' ? 'Cashier clearance validated' : 'Outstanding dues flagged');
        $operatorName = $request->input('operator_name') ?? 'Accounting Office';

        try {
            DB::transaction(function () use ($student, $newStatus, $notes, $operatorName) {
                $billing = $student->billingStatus;
                $previousStatus = $billing ? $billing->billing_status : 'WITH_BALANCE';

                if (!$billing) {
                    $billing = StudentBillingStatus::create([
                        'student_id' => $student->id,
                        'total_assessment' => 15500.00,
                        'current_balance' => $newStatus === 'CLEARED' ? 0.00 : 15500.00,
                        'total_paid' => $newStatus === 'CLEARED' ? 15500.00 : 0.00,
                        'billing_status' => $newStatus,
                        'exam_permit_status' => $newStatus === 'CLEARED' ? 'AVAILABLE' : 'BLOCKED',
                        'current_exam_period' => 'Prelim',
                        'last_cleared_at' => $newStatus === 'CLEARED' ? now() : null,
                    ]);
                    $student->update(['billing_status_id' => $billing->id]);
                } else {
                    $billing->update([
                        'billing_status' => $newStatus,
                        'exam_permit_status' => $newStatus === 'CLEARED' ? 'AVAILABLE' : 'BLOCKED',
                        'last_cleared_at' => $newStatus === 'CLEARED' ? now() : $billing->last_cleared_at,
                    ]);
                }

                FinancialStatusHistory::create([
                    'student_id' => $student->id,
                    'previous_status' => $previousStatus,
                    'new_status' => $newStatus,
                    'notes' => $notes,
                    'operator_name' => $operatorName,
                ]);
            });

            $student->load(['billingStatus', 'subjects', 'reprintRequests', 'clearanceHistories']);
            $payload = $this->formatStudentPayload($student);
            $payload['history'] = $student->clearanceHistories->map(function ($h) {
                return [
                    'id' => $h->id,
                    'student_id' => $h->student_id,
                    'previous_status' => $h->previous_status,
                    'new_status' => $h->new_status,
                    'notes' => $h->notes,
                    'operator_name' => $h->operator_name,
                    'created_at' => $h->created_at->format('Y-m-d H:i:s'),
                ];
            });

            return response()->json([
                'success' => true,
                'message' => "Financial clearance status updated to {$newStatus}.",
                'data' => $payload,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update financial status: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get clearance history / audit trail for a student.
     */
    public function clearanceHistory(string $id): JsonResponse
    {
        $student = Student::where('id', $id)
            ->orWhere('student_number', $id)
            ->first();

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found.',
            ], 404);
        }

        $histories = FinancialStatusHistory::where('student_id', $student->id)
            ->latest()
            ->get()
            ->map(function ($h) {
                return [
                    'id' => $h->id,
                    'student_id' => $h->student_id,
                    'previous_status' => $h->previous_status,
                    'new_status' => $h->new_status,
                    'notes' => $h->notes,
                    'operator_name' => $h->operator_name,
                    'created_at' => $h->created_at->format('Y-m-d H:i:s'),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $histories,
        ]);
    }

    /**
     * Record a kiosk permit print and atomically consume an authorized reprint token if present.
     */
    public function recordPrint(string $id): JsonResponse
    {
        $student = Student::with(['billingStatus', 'subjects', 'reprintRequests'])
            ->where('id', $id)
            ->orWhere('student_number', $id)
            ->orWhere('rfid_uid', $id)
            ->first();

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found.',
            ], 404);
        }

        try {
            DB::transaction(function () use ($student) {
                $billing = $student->billingStatus;

                $activeReprint = ReprintRequest::where('student_id', $student->id)
                    ->where('reprint_status', 'AUTHORIZED')
                    ->whereNull('printed_at')
                    ->latest('id')
                    ->lockForUpdate()
                    ->first();

                if ($activeReprint) {
                    $activeReprint->update([
                        'payment_status' => 'CONSUMED',
                        'reprint_status' => 'USED',
                        'printed_at' => now(),
                    ]);
                }

                if ($billing && $billing->exam_permit_status !== 'PRINTED') {
                    $billing->update([
                        'exam_permit_status' => 'PRINTED',
                    ]);
                }
            });

            $student->refresh()->load(['billingStatus', 'subjects', 'reprintRequests']);

            return response()->json([
                'success' => true,
                'message' => 'Permit print recorded.',
                'data' => $this->formatStudentPayload($student),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to record permit print: ' . $e->getMessage(),
            ], 500);
        }
    }
}
