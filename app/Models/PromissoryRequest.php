<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PromissoryRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'billing_status_id',
        'student_id',
        'request_number',
        'initial_payment',
        'remaining_balance',
        'reason',
        'remarks',
        'exam_period',
        'promise_to_pay_date',
        'guarantor_name',
        'guarantor_contact',
        'guarantor_relationship',
        'status',
        'requested_by_user_id',
        'approved_by_user_id',
        'official_receipt_number',
        'amount_paid',
        'accounting_remarks',
        'approved_at',
    ];

    protected $casts = [
        'initial_payment' => 'decimal:2',
        'remaining_balance' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'promise_to_pay_date' => 'date',
        'approved_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function billingStatus(): BelongsTo
    {
        return $this->belongsTo(StudentBillingStatus::class, 'billing_status_id');
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by_user_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }
}
