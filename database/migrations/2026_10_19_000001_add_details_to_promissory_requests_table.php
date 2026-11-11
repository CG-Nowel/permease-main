<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('promissory_requests', function (Blueprint $table) {
            $table->string('exam_period', 50)->nullable()->default('Midterms')->after('remarks');
            $table->date('promise_to_pay_date')->nullable()->after('exam_period');
            $table->string('guarantor_name', 100)->nullable()->after('promise_to_pay_date');
            $table->string('guarantor_contact', 50)->nullable()->after('guarantor_name');
            $table->string('guarantor_relationship', 50)->nullable()->after('guarantor_contact');
            $table->decimal('amount_paid', 10, 2)->default(0.00)->after('official_receipt_number');
        });
    }

    public function down(): void {
        Schema::table('promissory_requests', function (Blueprint $table) {
            $table->dropColumn([
                'exam_period',
                'promise_to_pay_date',
                'guarantor_name',
                'guarantor_contact',
                'guarantor_relationship',
                'amount_paid',
            ]);
        });
    }
};
