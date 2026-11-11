<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void {
        Schema::create('academic_terms', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('academic_year', 50);
            $table->string('semester', 50);
            $table->string('label', 100);
            $table->string('status', 30)->default('Archived');
            $table->boolean('is_active')->default(false);
            $table->timestamps();
        });

        // Seed default academic terms
        DB::table('academic_terms')->insert([
            [
                'code' => '2025-2026-2nd',
                'academic_year' => '2025–2026',
                'semester' => '2nd Sem',
                'label' => 'A.Y. 2025–2026 • 2nd Sem',
                'status' => 'Active Term',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => '2025-2026-1st',
                'academic_year' => '2025–2026',
                'semester' => '1st Sem',
                'label' => 'A.Y. 2025–2026 • 1st Sem',
                'status' => 'Previous',
                'is_active' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => '2024-2025-summer',
                'academic_year' => '2024–2025',
                'semester' => 'Summer',
                'label' => 'A.Y. 2024–2025 • Summer',
                'status' => 'Archived',
                'is_active' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => '2024-2025-2nd',
                'academic_year' => '2024–2025',
                'semester' => '2nd Sem',
                'label' => 'A.Y. 2024–2025 • 2nd Sem',
                'status' => 'Archived',
                'is_active' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => '2024-2025-1st',
                'academic_year' => '2024–2025',
                'semester' => '1st Sem',
                'label' => 'A.Y. 2024–2025 • 1st Sem',
                'status' => 'Archived',
                'is_active' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void {
        Schema::dropIfExists('academic_terms');
    }
};
