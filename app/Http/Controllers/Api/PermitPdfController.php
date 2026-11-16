<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\Student;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class PermitPdfController extends Controller
{
    /**
     * Generate A6 Landscape Examination Permit PDF for high-speed Kiosk printing.
     */
    public function generatePdf(Request $request, string $identifier)
    {
        $student = Student::with(['billingStatus', 'subjects'])
            ->where('id', $identifier)
            ->orWhere('student_number', $identifier)
            ->orWhere('rfid_uid', $identifier)
            ->first();

        if (!$student) {
            abort(404, 'Student examination record not found.');
        }

        $billing = $student->billingStatus;
        $activeTerm = AcademicTerm::where('is_active', true)->first();

        $academicYear = $student->academic_year ?? ($activeTerm ? $activeTerm->academic_year : '2026-2027');
        $semester = $student->semester ?? ($activeTerm ? $activeTerm->semester : '1st Semester');
        $examPeriod = $request->input('period') ?? ($activeTerm->exam_period ?? ($billing ? $billing->current_exam_period : 'Prelim'));
        $permitNumber = 'TP-2026-' . str_pad($student->id, 6, '0', STR_PAD_LEFT);
        $dateIssued = now()->format('F d, Y');

        // Extract subjects
        $subjects = $student->subjects->map(function ($s) {
            return [
                'code' => $s->subject_code,
                'title' => $s->subject_title,
                'units' => $s->units,
            ];
        })->toArray();

        // If no enrolled subjects found in database, provide standard curriculum subjects
        if (empty($subjects)) {
            $isIT = str_contains(strtoupper($student->course . ' ' . $student->program), 'IT') || str_contains(strtoupper($student->course . ' ' . $student->program), 'INFORMATION');
            if ($isIT) {
                $subjects = [
                    ['code' => 'IT 101', 'title' => 'Introduction to Computing', 'units' => 3],
                    ['code' => 'IT 102', 'title' => 'Computer Programming 1', 'units' => 3],
                    ['code' => 'IT 103', 'title' => 'Data Structures & Algorithms', 'units' => 3],
                    ['code' => 'GE 101', 'title' => 'Understanding the Self', 'units' => 3],
                    ['code' => 'GE 102', 'title' => 'Readings in Philippine History', 'units' => 3],
                    ['code' => 'PE 101', 'title' => 'Physical Activities Towards Health & Fitness 1', 'units' => 2],
                ];
            } else {
                $subjects = [
                    ['code' => 'CS 101', 'title' => 'Discrete Structures 1', 'units' => 3],
                    ['code' => 'CS 102', 'title' => 'Object-Oriented Programming', 'units' => 3],
                    ['code' => 'MATH 101', 'title' => 'Calculus for Computing', 'units' => 3],
                    ['code' => 'GE 101', 'title' => 'Purposive Communication', 'units' => 3],
                    ['code' => 'GE 104', 'title' => 'The Contemporary World', 'units' => 3],
                ];
            }
        }

        // Render PDF with dompdf in A6 landscape format
        $pdf = Pdf::loadView('permits.test-permit-pdf', [
            'student' => $student,
            'billing' => $billing,
            'academicYear' => $academicYear,
            'semester' => $semester,
            'examPeriod' => $examPeriod,
            'permitNumber' => $permitNumber,
            'dateIssued' => $dateIssued,
            'subjects' => $subjects,
        ])->setPaper('a6', 'landscape');

        $filename = "Examination_Permit_{$student->student_number}_{$examPeriod}.pdf";

        if ($request->has('download') && $request->download == '1') {
            return $pdf->download($filename);
        }

        return $pdf->stream($filename);
    }

    /**
     * Render direct auto-printing A6 Landscape HTML view for kiosk hardware dispensers.
     */
    public function printView(Request $request, string $identifier)
    {
        $student = Student::with(['billingStatus', 'subjects'])
            ->where('id', $identifier)
            ->orWhere('student_number', $identifier)
            ->orWhere('rfid_uid', $identifier)
            ->first();

        if (!$student) {
            abort(404, 'Student examination record not found.');
        }

        $billing = $student->billingStatus;
        $activeTerm = AcademicTerm::where('is_active', true)->first();

        $academicYear = $student->academic_year ?? ($activeTerm ? $activeTerm->academic_year : '2026-2027');
        $semester = $student->semester ?? ($activeTerm ? $activeTerm->semester : '1st Semester');
        $examPeriod = $request->input('period') ?? ($activeTerm->exam_period ?? ($billing ? $billing->current_exam_period : 'Prelim'));
        $permitNumber = 'TP-2026-' . str_pad($student->id, 6, '0', STR_PAD_LEFT);
        $dateIssued = now()->format('F d, Y');

        $subjects = $student->subjects->map(function ($s) {
            return [
                'code' => $s->subject_code,
                'title' => $s->subject_title,
                'units' => $s->units,
            ];
        })->toArray();

        if (empty($subjects)) {
            $isIT = str_contains(strtoupper($student->course . ' ' . $student->program), 'IT') || str_contains(strtoupper($student->course . ' ' . $student->program), 'INFORMATION');
            if ($isIT) {
                $subjects = [
                    ['code' => 'IT 101', 'title' => 'Introduction to Computing', 'units' => 3],
                    ['code' => 'IT 102', 'title' => 'Computer Programming 1', 'units' => 3],
                    ['code' => 'IT 103', 'title' => 'Data Structures & Algorithms', 'units' => 3],
                    ['code' => 'GE 101', 'title' => 'Understanding the Self', 'units' => 3],
                    ['code' => 'GE 102', 'title' => 'Readings in Philippine History', 'units' => 3],
                    ['code' => 'PE 101', 'title' => 'Physical Activities Towards Health & Fitness 1', 'units' => 2],
                ];
            } else {
                $subjects = [
                    ['code' => 'CS 101', 'title' => 'Discrete Structures 1', 'units' => 3],
                    ['code' => 'CS 102', 'title' => 'Object-Oriented Programming', 'units' => 3],
                    ['code' => 'MATH 101', 'title' => 'Calculus for Computing', 'units' => 3],
                    ['code' => 'GE 101', 'title' => 'Purposive Communication', 'units' => 3],
                    ['code' => 'GE 104', 'title' => 'The Contemporary World', 'units' => 3],
                ];
            }
        }

        return view('permits.test-permit-print', [
            'student' => $student,
            'billing' => $billing,
            'academicYear' => $academicYear,
            'semester' => $semester,
            'examPeriod' => $examPeriod,
            'permitNumber' => $permitNumber,
            'dateIssued' => $dateIssued,
            'subjects' => $subjects,
        ]);
    }
}
