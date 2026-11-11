<?php

namespace Tests\Feature;

use App\Models\AcademicTerm;
use App\Models\PromissoryRequest;
use App\Models\ReprintRequest;
use App\Models\Student;
use App\Models\StudentBillingStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SystemWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Ensure default academic term exists
        AcademicTerm::firstOrCreate(
            ['code' => 'AY2026-T1'],
            [
                'academic_year' => '2026-2027',
                'semester' => '1st Semester',
                'label' => 'S.Y. 2026-2027 1st Semester',
                'status' => 'Active Term',
                'is_active' => true,
            ]
        );

        // Ensure default staff users exist
        User::firstOrCreate(
            ['email' => 'registrar@permease.local'],
            [
                'name' => 'Registrar Officer',
                'role' => 'REGISTRAR',
                'password' => bcrypt('password123'),
                'rfid_uid' => 'REG-RFID-001',
            ]
        );

        User::firstOrCreate(
            ['email' => 'accounting@permease.local'],
            [
                'name' => 'Accounting Officer',
                'role' => 'ACCOUNTING',
                'password' => bcrypt('password123'),
                'rfid_uid' => 'ACC-RFID-001',
            ]
        );
    }

    /**
     * 1. Test Staff Authentication (Password & RFID)
     */
    public function test_staff_authentication_workflows(): void
    {
        // Password Login
        $response = $this->postJson('/api/login', [
            'email' => 'registrar@permease.local',
            'password' => 'password123',
        ]);
        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('user.role', 'REGISTRAR');

        // RFID Card Login
        $rfidResponse = $this->postJson('/api/login/rfid', [
            'rfid_uid' => 'ACC-RFID-001',
        ]);
        $rfidResponse->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('user.role', 'ACCOUNTING');
    }

    /**
     * 2. Test Academic Term Management
     */
    public function test_academic_term_lifecycle(): void
    {
        // List academic terms
        $res = $this->getJson('/api/academic-terms');
        $res->assertStatus(200)->assertJsonPath('success', true);

        // Create new term
        $newTermRes = $this->postJson('/api/academic-terms', [
            'academic_year' => '2027-2028',
            'semester' => '1st Semester',
            'is_active' => false,
        ]);
        $newTermRes->assertStatus(201);
        $termId = $newTermRes->json('new_term.id');

        // Set new term active
        $activeRes = $this->postJson('/api/academic-terms/set-active', ['id' => $termId]);
        $activeRes->assertStatus(200)
            ->assertJsonPath('active_term.id', $termId);
    }

    /**
     * 3. Test Student Registration & Automatic WITH_BALANCE + BLOCKED assignment
     */
    public function test_student_registration_and_billing_setup(): array
    {
        $payload = [
            'student_number' => 'TEST-2026-9001',
            'first_name' => 'John',
            'middle_name' => 'Fitzgerald',
            'last_name' => 'Kennedy',
            'course' => 'BS',
            'program' => 'Computer Science',
            'grade_year_level' => '1st Year',
            'section' => 'Section A',
            'student_type' => 'Regular',
            'rfid_uid' => 'CARD-TEST-9001',
            'subjects' => [
                ['code' => 'CS 101', 'title' => 'Intro to Programming', 'units' => 3, 'type' => 'Major'],
                ['code' => 'MATH 101', 'title' => 'Calculus 1', 'units' => 3, 'type' => 'General'],
            ],
        ];

        $res = $this->postJson('/api/students', $payload);
        $res->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.financial_status.status', 'WITH_BALANCE')
            ->assertJsonPath('data.current_permit.status', 'BLOCKED');

        $studentData = $res->json('data');

        // Verify retrieval by ID
        $getById = $this->getJson("/api/students/{$studentData['id']}");
        $getById->assertStatus(200)->assertJsonPath('data.student_number', 'TEST-2026-9001');

        // Verify retrieval by Student Number
        $getByNum = $this->getJson("/api/students/TEST-2026-9001");
        $getByNum->assertStatus(200)->assertJsonPath('data.id', $studentData['id']);

        // Verify retrieval by RFID UID
        $getByRfid = $this->getJson("/api/students/CARD-TEST-9001");
        $getByRfid->assertStatus(200)->assertJsonPath('data.id', $studentData['id']);

        return $studentData;
    }

    /**
     * 4. Test Student Details and Subject Load Update
     */
    public function test_student_update_workflow(): void
    {
        $student = $this->test_student_registration_and_billing_setup();

        $updateRes = $this->putJson("/api/students/{$student['id']}", [
            'grade_year_level' => '2nd Year',
            'section' => 'Section B',
            'subjects' => [
                ['code' => 'CS 201', 'title' => 'Data Structures', 'units' => 3, 'type' => 'Major'],
                ['code' => 'CS 202', 'title' => 'Algorithms', 'units' => 3, 'type' => 'Major'],
                ['code' => 'GE 101', 'title' => 'Ethics', 'units' => 3, 'type' => 'General'],
            ],
        ]);

        $updateRes->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.grade_year_level', '2nd Year')
            ->assertJsonPath('data.section', 'Section B')
            ->assertJsonPath('data.units', 9);
    }

    /**
     * 5. Test Promissory Note Lifecycle (Filing -> Accounting Approval -> Unlock Permit)
     */
    public function test_promissory_note_full_lifecycle(): void
    {
        $student = $this->test_student_registration_and_billing_setup();

        // Step 1: Registrar files promissory request
        $fileRes = $this->postJson('/api/promissory-requests', [
            'student_id' => $student['id'],
            'initial_payment' => 3000.00,
            'reason' => 'Pending salary remittance from parent OFW',
            'exam_period' => 'Prelim',
            'promise_to_pay_date' => '2026-11-15',
            'guarantor_name' => 'Rose Kennedy',
            'guarantor_contact' => '09171234567',
            'guarantor_relationship' => 'Mother',
            'remarks' => 'Endorsed for promissory clearance by Registrar',
        ]);

        $fileRes->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'PENDING');

        $pnId = $fileRes->json('data.id');

        // Step 2: Prevent duplicate pending promissory requests
        $dupRes = $this->postJson('/api/promissory-requests', [
            'student_id' => $student['id'],
            'reason' => 'Duplicate attempt',
        ]);
        $dupRes->assertStatus(422);

        // Step 3: Accounting approves promissory with OR Number and downpayment
        $approveRes = $this->postJson("/api/promissory-requests/{$pnId}/approve", [
            'official_receipt_number' => 'OR-TEST-7788',
            'amount_paid' => 3000.00,
            'accounting_remarks' => 'Downpayment received. Permit released.',
        ]);

        $approveRes->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.request.status', 'APPROVED');

        // Step 4: Verify student billing and permit are now CLEARED / AVAILABLE
        $studentCheck = $this->getJson("/api/students/{$student['id']}");
        $studentCheck->assertStatus(200)
            ->assertJsonPath('data.financial_status.status', 'CLEARED')
            ->assertJsonPath('data.current_permit.status', 'AVAILABLE');
    }

    /**
     * 6. Test Examination Permit Reprint Payment Workflow
     */
    public function test_permit_reprint_authorization_and_consumption(): void
    {
        $student = $this->test_student_registration_and_billing_setup();

        // Record reprint fee (₱50)
        $reprintRes = $this->postJson('/api/reprints', [
            'student_id' => $student['id'],
            'reference_number' => 'REPRINT-OR-99001',
            'amount' => 50.00,
            'notes' => 'Lost permit replacement fee paid at cashier',
        ]);

        $reprintRes->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.reprint_status', 'AUTHORIZED');

        $reprintId = $reprintRes->json('data.id');

        // Consume the reprint authorization
        $consumeRes = $this->postJson("/api/reprints/{$reprintId}/consume");
        $consumeRes->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.reprint_status', 'USED');
    }

    /**
     * 7. Test Examination Permit Render Views (HTML Print & DomPDF)
     */
    public function test_permit_render_views(): void
    {
        $student = $this->test_student_registration_and_billing_setup();

        // Test HTML Auto-Printing View
        $printHtml = $this->get("/permits/{$student['id']}/print");
        $printHtml->assertStatus(200)
            ->assertSee('EXAMINATION PERMIT')
            ->assertSee($student['student_number']);

        // Test PDF Generation View
        $pdfStream = $this->get("/permits/{$student['id']}/pdf");
        $pdfStream->assertStatus(200)
            ->assertHeader('content-type', 'application/pdf');
    }
}
