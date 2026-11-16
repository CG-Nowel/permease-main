<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\StudentBillingStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class AcademicTermController extends Controller
{
    public const EXAM_PERIODS = ['Prelim', 'Midterms', 'Pre-Finals', 'Finals'];
    /**
     * Get all academic terms and the currently active term.
     */
    public function index(): JsonResponse
    {
        $terms = AcademicTerm::orderBy('id', 'asc')->get();
        $activeTerm = $terms->firstWhere('is_active', true) ?? $terms->first();

        return response()->json([
            'success' => true,
            'active_term' => $activeTerm,
            'data' => $terms,
        ]);
    }

    /**
     * Set a specific academic term as active.
     */
    public function setActive(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id' => ['nullable', 'integer', 'exists:academic_terms,id'],
            'code' => ['nullable', 'string', 'exists:academic_terms,code'],
            'label' => ['nullable', 'string', 'exists:academic_terms,label'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $term = null;
        if ($request->filled('id')) {
            $term = AcademicTerm::find($request->id);
        } elseif ($request->filled('code')) {
            $term = AcademicTerm::where('code', $request->code)->first();
        } elseif ($request->filled('label')) {
            $term = AcademicTerm::where('label', $request->label)->first();
        }

        if (!$term) {
            return response()->json([
                'success' => false,
                'message' => 'Academic term not found.',
            ], 404);
        }

        DB::transaction(function () use ($term) {
            // Demote all terms to Archived and not active
            AcademicTerm::query()->update([
                'is_active' => false,
                'status' => 'Archived',
            ]);

            // Directly activate target term
            AcademicTerm::where('id', $term->id)->update([
                'is_active' => true,
                'status' => 'Active Term',
            ]);

            // Mark the immediately preceding term as 'Previous' if one exists
            AcademicTerm::where('id', '<', $term->id)
                ->orderBy('id', 'desc')
                ->limit(1)
                ->update(['status' => 'Previous']);

            StudentBillingStatus::query()->update([
                'current_exam_period' => $term->exam_period ?: 'Prelim',
            ]);
        });


        $updatedTerms = AcademicTerm::orderBy('id', 'asc')->get();
        $freshActive = AcademicTerm::find($term->id);

        return response()->json([
            'success' => true,
            'message' => "Academic term successfully updated to {$freshActive->label}.",
            'active_term' => $freshActive,
            'data' => $updatedTerms,
        ]);
    }

    /**
     * Create a new academic term / school year.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'academic_year' => ['required', 'string', 'max:50'],
            'semester' => ['required', 'string', 'max:50'],
            'exam_period' => ['nullable', 'string', 'in:' . implode(',', self::EXAM_PERIODS)],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $academicYear = trim($request->input('academic_year'));
        $semester = trim($request->input('semester'));
        $examPeriod = $request->input('exam_period') ?: 'Prelim';
        $isActive = filter_var($request->input('is_active', false), FILTER_VALIDATE_BOOLEAN);

        $cleanYear = str_replace(['–', '—', ' '], '-', $academicYear);
        $semCode = strtolower(str_replace(' ', '', $semester));
        $code = "{$cleanYear}-{$semCode}";
        $label = "A.Y. {$academicYear} • {$semester}";

        $existing = AcademicTerm::where('code', $code)->orWhere('label', $label)->first();
        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => "The term '{$label}' already exists.",
            ], 422);
        }

        $term = DB::transaction(function () use ($code, $academicYear, $semester, $examPeriod, $label, $isActive) {
            if ($isActive) {
                AcademicTerm::query()->update([
                    'is_active' => false,
                    'status' => 'Archived',
                ]);

                StudentBillingStatus::query()->update([
                    'current_exam_period' => $examPeriod,
                ]);
            }

            return AcademicTerm::create([
                'code' => $code,
                'academic_year' => $academicYear,
                'semester' => $semester,
                'exam_period' => $examPeriod,
                'label' => $label,
                'status' => $isActive ? 'Active Term' : 'Archived',
                'is_active' => $isActive,
            ]);
        });

        $updatedTerms = AcademicTerm::orderBy('id', 'asc')->get();
        $activeTerm = $updatedTerms->firstWhere('is_active', true) ?? $updatedTerms->first();

        return response()->json([
            'success' => true,
            'message' => "Academic Term '{$term->label}' created successfully.",
            'new_term' => $term,
            'active_term' => $activeTerm,
            'data' => $updatedTerms,
        ], 201);
    }

    /**
     * Set the active examination period (Prelim, Midterms, Pre-Finals, Finals) for permit printing.
     */
    public function setExamPeriod(Request $request): JsonResponse
    {
        $actor = $request->user();
        if ($actor && strtoupper((string) $actor->role) !== 'REGISTRAR') {
            return response()->json([
                'success' => false,
                'message' => 'Only the Registrar can change the examination period for permit printing.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'exam_period' => ['required', 'string', 'in:' . implode(',', self::EXAM_PERIODS)],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $examPeriod = $request->input('exam_period');
        $activeTerm = AcademicTerm::where('is_active', true)->first() ?? AcademicTerm::orderBy('id', 'asc')->first();

        if (!$activeTerm) {
            return response()->json([
                'success' => false,
                'message' => 'No active academic term found.',
            ], 404);
        }

        DB::transaction(function () use ($activeTerm, $examPeriod) {
            $activeTerm->update([
                'exam_period' => $examPeriod,
                'is_active' => true,
                'status' => 'Active Term',
            ]);

            StudentBillingStatus::query()->update([
                'current_exam_period' => $examPeriod,
            ]);
        });

        $updatedTerms = AcademicTerm::orderBy('id', 'asc')->get();
        $freshActive = AcademicTerm::find($activeTerm->id);

        return response()->json([
            'success' => true,
            'message' => "Active examination period updated to {$examPeriod}.",
            'exam_period' => $examPeriod,
            'active_term' => $freshActive,
            'data' => $updatedTerms,
        ]);
    }
}

