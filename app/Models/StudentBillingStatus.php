<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StudentBillingStatus extends Model
{
    use HasFactory;

    protected $table = 'student_billing_statuses';

    protected $fillable = [
        'student_id',
        'total_assessment',
        'current_balance',
        'total_paid',
        'billing_status',
        'exam_permit_status',
        'current_exam_period',
        'last_cleared_at',
    ];

    protected $casts = [
        'total_assessment' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'total_paid' => 'decimal:2',
        'last_cleared_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function subjects(): HasMany
    {
        return $this->hasMany(StudentSubject::class, 'billing_status_id');
    }

    public function promissoryRequests(): HasMany
    {
        return $this->hasMany(PromissoryRequest::class, 'billing_status_id');
    }

    public function reprintRequests(): HasMany
    {
        return $this->hasMany(ReprintRequest::class, 'billing_status_id');
    }
}
