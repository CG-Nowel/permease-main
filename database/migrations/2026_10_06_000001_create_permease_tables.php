<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // 1. Students Table
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('student_number', 32)->unique();
            $table->string('first_name', 100);
            $table->string('middle_name', 100)->nullable();
            $table->string('last_name', 100);
            $table->string('course', 150);
            $table->string('program', 50);
            $table->string('grade_year_level', 20);
            $table->string('section', 20);
            $table->string('student_type', 20)->default('Regular');
            $table->string('semester', 30)->default('1st Semester');
            $table->string('academic_year', 30)->default('2026-2027');
            $table->string('rfid_uid', 64)->nullable()->unique();
            $table->string('enrollment_status', 30)->default('ENROLLED');
            $table->unsignedBigInteger('billing_status_id')->nullable();
            $table->timestamps();
        });

        // 2. Student Billing Statuses Table
        Schema::create('student_billing_statuses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->decimal('total_assessment', 10, 2)->default(0.00);
            $table->decimal('current_balance', 10, 2)->default(0.00);
            $table->decimal('total_paid', 10, 2)->default(0.00);
            $table->string('billing_status', 30)->default('WITH_BALANCE');
            $table->string('exam_permit_status', 30)->default('BLOCKED');
            $table->string('current_exam_period', 50)->default('Prelim');
            $table->timestamp('last_cleared_at')->nullable();
            $table->timestamps();
        });

        // Link student to billing_status
        Schema::table('students', function (Blueprint $table) {
            $table->foreign('billing_status_id')->references('id')->on('student_billing_statuses')->onDelete('set null');
        });

        // 3. Student Subjects Table (Current Subjects Only)
        Schema::create('student_subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('billing_status_id')->constrained('student_billing_statuses')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->string('subject_code', 30);
            $table->string('subject_title', 150);
            $table->unsignedTinyInteger('units')->default(3);
            $table->string('subject_type', 50)->default('Major');
            $table->timestamps();
        });

        // 4. Promissory Requests Table
        Schema::create('promissory_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('billing_status_id')->constrained('student_billing_statuses')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->string('request_number', 32)->unique();
            $table->decimal('initial_payment', 10, 2)->default(0.00);
            $table->decimal('remaining_balance', 10, 2)->default(0.00);
            $table->string('reason', 255);
            $table->text('remarks')->nullable();
            $table->string('status', 30)->default('PENDING');
            $table->foreignId('requested_by_user_id')->nullable()->constrained('users');
            $table->foreignId('approved_by_user_id')->nullable()->constrained('users');
            $table->string('official_receipt_number', 64)->nullable();
            $table->text('accounting_remarks')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });

        // 5. Reprint Requests Table
        Schema::create('reprint_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('billing_status_id')->constrained('student_billing_statuses')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->string('reference_number', 32)->unique();
            $table->decimal('reprint_fee', 8, 2)->default(50.00);
            $table->string('payment_status', 30)->default('PENDING');
            $table->string('reprint_status', 30)->default('AUTHORIZED');
            $table->string('official_receipt_number', 64)->nullable();
            $table->foreignId('processed_by_user_id')->nullable()->constrained('users');
            $table->timestamp('printed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('reprint_requests');
        Schema::dropIfExists('promissory_requests');
        Schema::dropIfExists('student_subjects');
        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['billing_status_id']);
        });
        Schema::dropIfExists('student_billing_statuses');
        Schema::dropIfExists('students');
    }
};
