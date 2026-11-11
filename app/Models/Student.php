<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_number',
        'first_name',
        'middle_name',
        'last_name',
        'course',
        'program',
        'grade_year_level',
        'section',
        'student_type',
        'semester',
        'academic_year',
        'rfid_uid',
        'enrollment_status',
        'billing_status_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function billingStatus(): BelongsTo
    {
        return $this->belongsTo(StudentBillingStatus::class, 'billing_status_id');
    }

    public function subjects(): HasMany
    {
        return $this->hasMany(StudentSubject::class, 'student_id');
    }

    public function promissoryRequests(): HasMany
    {
        return $this->hasMany(PromissoryRequest::class, 'student_id');
    }

    public function reprintRequests(): HasMany
    {
        return $this->hasMany(ReprintRequest::class, 'student_id');
    }

    public function clearanceHistories(): HasMany
    {
        return $this->hasMany(FinancialStatusHistory::class, 'student_id')->latest();
    }

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->middle_name} {$this->last_name}");
    }
}
