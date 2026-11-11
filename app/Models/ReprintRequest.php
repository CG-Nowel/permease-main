<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReprintRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'billing_status_id',
        'student_id',
        'reference_number',
        'reprint_fee',
        'payment_status',
        'reprint_status',
        'official_receipt_number',
        'processed_by_user_id',
        'printed_at',
    ];

    protected $casts = [
        'reprint_fee' => 'decimal:2',
        'printed_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function billingStatus(): BelongsTo
    {
        return $this->belongsTo(StudentBillingStatus::class, 'billing_status_id');
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by_user_id');
    }
}
