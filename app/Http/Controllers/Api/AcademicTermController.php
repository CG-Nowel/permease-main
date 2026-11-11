<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class AcademicTermController extends Controller
{
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

        $term = DB::transaction(function () use ($code, $academicYear, $semester, $label, $isActive) {
            if ($isActive) {
                AcademicTerm::query()->update([
                    'is_active' => false,
                    'status' => 'Archived',
                ]);
            }

            return AcademicTerm::create([
                'code' => $code,
                'academic_year' => $academicYear,
                'semester' => $semester,
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
}

