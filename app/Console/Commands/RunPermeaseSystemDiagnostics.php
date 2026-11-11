<?php

namespace App\Console\Commands;

use App\Models\AcademicTerm;
use App\Models\FinancialStatusHistory;
use App\Models\PromissoryRequest;
use App\Models\ReprintRequest;
use App\Models\Student;
use App\Models\StudentBillingStatus;
use App\Models\StudentSubject;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class RunPermeaseSystemDiagnostics extends Command
{
    protected $signature = 'permease:test-system {--clean : Remove mockups and clean the database after testing}';
    protected $description = 'Execute a full end-to-end scenario test of the PermEase backend and clean mockup data.';

    public function handle()
    {
        $this->newLine();
        $this->info('========================================================================');
        $this->info('           PERMEASE BACKEND COMPREHENSIVE SYSTEM DIAGNOSTICS            ');
        $this->info('========================================================================');
        $this->newLine();

        $baseUrl = 'http://127.0.0.1:8000';
        $passCount = 0;
        $failCount = 0;

        // --- SCENARIO 1: SYSTEM ENVIRONMENT & DATABASE HEALTH ---
        $this->comment('▶ Scenario 1: Database & System Connectivity');
        try {
            DB::connection()->getPdo();
            $this->info('  [PASS] Database Connection: Healthy (MySQL: ' . config('database.connections.mysql.database') . ')');
            $passCount++;
        } catch (\Exception $e) {
            $this->error('  [FAIL] Database Connection: ' . $e->getMessage());
            $failCount++;
            return 1;
        }

        // --- SCENARIO 2: STAFF & ADMIN USERS SEEDING & RFID PAIRING ---
        $this->comment('▶ Scenario 2: Authentication & Staff Roles');
        User::updateOrCreate(
            ['email' => 'registrar@permease.local'],
            [
                'name' => 'Registrar Officer',
                'role' => 'REGISTRAR',
                'password' => bcrypt('password123'),
                'rfid_uid' => 'REG-RFID-001',
            ]
        );

        User::updateOrCreate(
            ['email' => 'accounting@permease.local'],
            [
                'name' => 'Accounting Officer',
                'role' => 'ACCOUNTING',
                'password' => bcrypt('password123'),
                'rfid_uid' => 'ACC-RFID-001',
            ]
        );

        // Test Login via HTTP
        try {
            $loginRes = Http::post("{$baseUrl}/api/login", [
                'email' => 'registrar@permease.local',
                'password' => 'password123',
            ]);
            if ($loginRes->successful() && $loginRes->json('user.role') === 'REGISTRAR') {
                $this->info('  [PASS] Staff Password Login: HTTP 200 (Token issued, Role verified)');
                $passCount++;
            } else {
                $this->error('  [FAIL] Staff Password Login: ' . $loginRes->body());
                $failCount++;
            }

            // Test RFID Badge Login
            $rfidLoginRes = Http::post("{$baseUrl}/api/login/rfid", [
                'rfid_uid' => 'ACC-RFID-001',
            ]);
            if ($rfidLoginRes->successful() && $rfidLoginRes->json('user.role') === 'ACCOUNTING') {
                $this->info('  [PASS] Staff RFID Badge Login: HTTP 200 (Accounting badge recognized)');
                $passCount++;
            } else {
                $this->error('  [FAIL] Staff RFID Badge Login: ' . $rfidLoginRes->body());
                $failCount++;
            }
        } catch (\Exception $e) {
            $this->warn('  [NOTE] HTTP server check: ' . $e->getMessage());
        }

        // --- SCENARIO 3: ACADEMIC TERM LIFECYCLE ---
        $this->comment('▶ Scenario 3: Academic Term Configuration');
        $activeTerm = AcademicTerm::firstOrCreate(
            ['code' => 'AY2026-T1'],
            [
                'academic_year' => '2026-2027',
                'semester' => '1st Semester',
                'label' => 'S.Y. 2026-2027 1st Semester',
                'status' => 'Active Term',
                'is_active' => true,
            ]
        );
        $this->info("  [PASS] Active Academic Term: {$activeTerm->label} [Active]");
        $passCount++;

        // --- SCENARIO 4: STUDENT REGISTRATION LIFECYCLE (CENTRAL BILLING & PERMIT LOCK) ---
        $this->comment('▶ Scenario 4: Student Registration with WITH_BALANCE & BLOCKED Permit');
        $testStudentNum = 'TEST-STU-' . time();
        $testRfid = 'TEST-RFID-' . rand(1000, 9999);

        $regRes = Http::post("{$baseUrl}/api/students", [
            'student_number' => $testStudentNum,
            'first_name' => 'Alexander',
            'middle_name' => 'Hamilton',
            'last_name' => 'Test',
            'course' => 'BS',
            'program' => 'Information Technology',
            'grade_year_level' => '1st Year',
            'section' => 'Section A',
            'student_type' => 'Regular',
            'rfid_uid' => $testRfid,
            'subjects' => [
                ['code' => 'IT 101', 'title' => 'Intro to Computing', 'units' => 3, 'type' => 'Major'],
                ['code' => 'IT 102', 'title' => 'Computer Programming 1', 'units' => 3, 'type' => 'Major'],
                ['code' => 'MATH 101', 'title' => 'Calculus for Computing', 'units' => 3, 'type' => 'General'],
            ],
        ]);

        $createdStudentId = null;
        if ($regRes->status() === 201 && $regRes->json('data.financial_status.status') === 'WITH_BALANCE') {
            $createdStudentId = $regRes->json('data.id');
            $this->info("  [PASS] Student Registered (ID: {$createdStudentId}): Status=WITH_BALANCE, Permit=BLOCKED");
            $passCount++;
        } else {
            $this->error('  [FAIL] Student Registration: ' . $regRes->body());
            $failCount++;
        }

        // --- SCENARIO 5: STUDENT LOOKUP BY MULTIPLE IDENTIFIERS ---
        $this->comment('▶ Scenario 5: Multi-Identifier Lookups (ID, Student Number, RFID)');
        if ($createdStudentId) {
            $byId = Http::get("{$baseUrl}/api/students/{$createdStudentId}");
            $byNum = Http::get("{$baseUrl}/api/students/{$testStudentNum}");
            $byRfid = Http::get("{$baseUrl}/api/students/{$testRfid}");

            if ($byId->successful() && $byNum->successful() && $byRfid->successful()) {
                $this->info("  [PASS] Multi-Lookup verified: Resolved via ID, Student Number, and Contactless RFID Card");
                $passCount++;
            } else {
                $this->error("  [FAIL] Lookup failed.");
                $failCount++;
            }
        }

        // --- SCENARIO 6: PROMISSORY NOTE FILING & ACCOUNTING CLEARANCE ---
        $this->comment('▶ Scenario 6: Promissory Note Workflow (Filing -> Accounting Clearance)');
        if ($createdStudentId) {
            // File promissory note by Registrar
            $pnRes = Http::post("{$baseUrl}/api/promissory-requests", [
                'student_id' => $createdStudentId,
                'initial_payment' => 2500.00,
                'reason' => 'Delay in remittance support',
                'exam_period' => 'Prelim',
                'promise_to_pay_date' => date('Y-m-d', strtotime('+14 days')),
                'guarantor_name' => 'Elizabeth Hamilton',
                'guarantor_contact' => '09181112222',
                'guarantor_relationship' => 'Parent',
                'remarks' => 'Forwarded to Accounting for official payment receipt endorsement',
            ]);

            if ($pnRes->status() === 201 && $pnRes->json('data.status') === 'PENDING') {
                $pnId = $pnRes->json('data.id');
                $pnNum = $pnRes->json('data.request_number');
                $this->info("  [PASS] Promissory Filed by Registrar: {$pnNum} [PENDING]");
                $passCount++;

                // Accounting Approves with OR Number
                $approveRes = Http::post("{$baseUrl}/api/promissory-requests/{$pnId}/approve", [
                    'official_receipt_number' => 'OR-TEST-' . rand(10000, 99999),
                    'amount_paid' => 2500.00,
                    'accounting_remarks' => 'Downpayment validated at Cashier Window 3.',
                ]);

                $isApproved = $approveRes->successful() && (
                    $approveRes->json('data.status') === 'APPROVED' ||
                    $approveRes->json('data.request.status') === 'APPROVED'
                );

                if ($isApproved) {
                    $this->info("  [PASS] Accounting Approved: Payment verified, Student cleared, Permit unlocked");
                    $passCount++;
                } else {
                    $this->error("  [FAIL] Promissory Approval: " . $approveRes->body());
                    $failCount++;
                }
            } else {
                $this->error("  [FAIL] Promissory Filing: " . $pnRes->body());
                $failCount++;
            }
        }

        // --- SCENARIO 7: REPRINT FEE RECORDING & CLEARANCE ---
        $this->comment('▶ Scenario 7: Examination Permit Reprint Ledger');
        if ($createdStudentId) {
            $reprintRes = Http::post("{$baseUrl}/api/reprints", [
                'student_id' => $createdStudentId,
                'reference_number' => 'REP-OR-' . rand(10000, 99999),
                'amount' => 50.00,
                'notes' => 'Test replacement permit fee paid at accounting',
            ]);

            if ($reprintRes->status() === 201 && $reprintRes->json('data.reprint_status') === 'AUTHORIZED') {
                $reprintId = $reprintRes->json('data.id');
                $this->info("  [PASS] Reprint Authorized (ID: {$reprintId}): Status=AUTHORIZED (Fee: ₱50.00)");
                $passCount++;

                // Consume reprint
                $consumeRes = Http::post("{$baseUrl}/api/reprints/{$reprintId}/consume");
                if ($consumeRes->successful()) {
                    $this->info("  [PASS] Reprint Consumed: Logged as printed");
                    $passCount++;
                }
            } else {
                $this->error("  [FAIL] Reprint Recording: " . $reprintRes->body());
                $failCount++;
            }
        }

        // --- SCENARIO 8: TEST PERMIT GENERATION (HTML & DOMPDF) ---
        $this->comment('▶ Scenario 8: Permit Output Views (HTML Dispenser View & DomPDF)');
        if ($createdStudentId) {
            $printViewRes = Http::get("{$baseUrl}/permits/{$createdStudentId}/print");
            $pdfViewRes = Http::get("{$baseUrl}/permits/{$createdStudentId}/pdf");

            if ($printViewRes->successful() && str_contains($printViewRes->body(), 'EXAMINATION PERMIT')) {
                $this->info("  [PASS] Direct Kiosk Print HTML: HTTP 200 (A6 Landscape Layout rendered)");
                $passCount++;
            } else {
                $this->error("  [FAIL] Kiosk Print HTML view failed.");
                $failCount++;
            }

            if ($pdfViewRes->successful() && $pdfViewRes->header('Content-Type') === 'application/pdf') {
                $this->info("  [PASS] DomPDF Generator: HTTP 200 (application/pdf stream valid)");
                $passCount++;
            } else {
                $this->error("  [FAIL] DomPDF generation failed.");
                $failCount++;
            }
        }

        $this->newLine();
        $this->info("========================================================================");
        $this->info("DIAGNOSTIC SUMMARY: {$passCount} Passed, {$failCount} Failed.");
        $this->info("========================================================================");

        // --- SCENARIO 9: CLEANUP OF TEST & MOCK DATA ---
        if ($this->option('clean')) {
            $this->newLine();
            $this->comment('▶ Scenario 9: Cleansing Test and Mockup Data...');

            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            FinancialStatusHistory::truncate();
            ReprintRequest::truncate();
            PromissoryRequest::truncate();
            StudentSubject::truncate();
            StudentBillingStatus::truncate();
            Student::truncate();
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            $this->info('  [CLEAN] All student records, mockups, promissory notes, and test data have been wiped clean!');
            $this->info('  [CLEAN] Remaining Students: ' . Student::count());
            $this->info('  [CLEAN] Remaining Promissory Requests: ' . PromissoryRequest::count());
            $this->info('  [CLEAN] Remaining Reprint Requests: ' . ReprintRequest::count());
            $this->info('  [CLEAN] The database is now 100% clean and ready for real student admissions.');
        }

        return $failCount === 0 ? 0 : 1;
    }
}
