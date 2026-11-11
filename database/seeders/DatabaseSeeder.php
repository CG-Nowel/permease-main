<?php

namespace Database\Seeders;

use App\Models\Student;
use App\Models\StudentBillingStatus;
use App\Models\StudentSubject;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $mockStudents = [
            [
                'id' => 1,
                'student_number' => '2026-00001',
                'first_name' => 'Juan',
                'middle_name' => 'Protacio',
                'last_name' => 'Dela Cruz',
                'course' => 'BS',
                'program' => 'Information Technology',
                'grade_year_level' => '3rd Year',
                'section' => 'Section A',
                'student_type' => 'Regular',
                'rfid_uid' => 'E4A28B10',
                'billing_status' => 'CLEARED',
                'current_balance' => 0.00,
                'total_assessment' => 18000.00,
                'total_paid' => 18000.00,
                'exam_permit_status' => 'AVAILABLE',
            ],
            [
                'id' => 2,
                'student_number' => '2026-00002',
                'first_name' => 'Maria Clara',
                'middle_name' => 'De Los',
                'last_name' => 'Santos',
                'course' => 'BS',
                'program' => 'Computer Science',
                'grade_year_level' => '2nd Year',
                'section' => 'Section B',
                'student_type' => 'Regular',
                'rfid_uid' => 'A9B8C7D6',
                'billing_status' => 'WITH_BALANCE',
                'current_balance' => 8500.00,
                'total_assessment' => 19500.00,
                'total_paid' => 11000.00,
                'exam_permit_status' => 'BLOCKED',
            ],
            [
                'id' => 3,
                'student_number' => '2026-00003',
                'first_name' => 'Crisostomo',
                'middle_name' => 'Ibarra',
                'last_name' => 'Magsaysay',
                'course' => 'BS',
                'program' => 'Information Systems',
                'grade_year_level' => '4th Year',
                'section' => 'Section A',
                'student_type' => 'Irregular',
                'rfid_uid' => '55FF33AA',
                'billing_status' => 'CLEARED',
                'current_balance' => 0.00,
                'total_assessment' => 15000.00,
                'total_paid' => 15000.00,
                'exam_permit_status' => 'PRINTED',
            ],
        ];

        foreach ($mockStudents as $data) {
            $existing = Student::where('student_number', $data['student_number'])->first();
            if ($existing) continue;

            $student = Student::create([
                'id' => $data['id'],
                'student_number' => $data['student_number'],
                'first_name' => $data['first_name'],
                'middle_name' => $data['middle_name'],
                'last_name' => $data['last_name'],
                'course' => $data['course'],
                'program' => $data['program'],
                'grade_year_level' => $data['grade_year_level'],
                'section' => $data['section'],
                'student_type' => $data['student_type'],
                'semester' => '1st Semester',
                'academic_year' => '2026-2027',
                'rfid_uid' => $data['rfid_uid'],
                'enrollment_status' => 'ENROLLED',
            ]);

            $billing = StudentBillingStatus::create([
                'student_id' => $student->id,
                'total_assessment' => $data['total_assessment'],
                'current_balance' => $data['current_balance'],
                'total_paid' => $data['total_paid'],
                'billing_status' => $data['billing_status'],
                'exam_permit_status' => $data['exam_permit_status'],
                'current_exam_period' => 'Prelim',
                'last_cleared_at' => $data['billing_status'] === 'CLEARED' ? now() : null,
            ]);

            $student->update(['billing_status_id' => $billing->id]);
        }

        // Seed Staff Users (Registrar & Accounting dummy accounts without RFID)
        $mockUsers = [
            [
                'name' => 'Registrar Office',
                'email' => 'registrar@permease.local',
                'role' => 'REGISTRAR',
                'password' => bcrypt('password123'),
                'rfid_uid' => null,
            ],
            [
                'name' => 'Accounting Office',
                'email' => 'accounting@permease.local',
                'role' => 'ACCOUNTING',
                'password' => bcrypt('password123'),
                'rfid_uid' => null,
            ],
        ];

        foreach ($mockUsers as $userData) {
            \App\Models\User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }

        // Seed initial real reprint records if table is empty
        if (\App\Models\ReprintRequest::count() === 0) {
            $student = Student::first();
            $accountingUser = \App\Models\User::where('role', 'ACCOUNTING')->first();

            if ($student) {
                \App\Models\ReprintRequest::create([
                    'billing_status_id' => $student->billing_status_id,
                    'student_id' => $student->id,
                    'reference_number' => 'OR-2026-89104',
                    'official_receipt_number' => 'OR-2026-89104',
                    'reprint_fee' => 50.00,
                    'payment_status' => 'PAID',
                    'reprint_status' => 'AUTHORIZED',
                    'processed_by_user_id' => $accountingUser ? $accountingUser->id : 2,
                    'printed_at' => null,
                ]);
            }
        }
    }
}
