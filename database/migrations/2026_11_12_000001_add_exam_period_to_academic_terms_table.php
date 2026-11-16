<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('academic_terms', function (Blueprint $table) {
            if (!Schema::hasColumn('academic_terms', 'exam_period')) {
                $table->string('exam_period', 30)->default('Prelim')->after('semester');
            }
        });
    }

    public function down(): void
    {
        Schema::table('academic_terms', function (Blueprint $table) {
            if (Schema::hasColumn('academic_terms', 'exam_period')) {
                $table->dropColumn('exam_period');
            }
        });
    }
};
