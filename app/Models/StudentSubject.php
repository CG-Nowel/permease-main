<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentSubject extends Model
{
    use HasFactory;

    protected $fillable = [
        'billing_status_id',
        'student_id',
        'subject_code',
        'subject_title',
        'units',
        'subject_type',
    ];

    protected $casts = [
        'units' => 'integer',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function billingStatus(): BelongsTo
    {
        return $this->belongsTo(StudentBillingStatus::class, 'billing_status_id');
    }
}
