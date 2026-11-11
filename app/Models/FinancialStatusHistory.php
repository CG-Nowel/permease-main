<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinancialStatusHistory extends Model
{
    use HasFactory;

    protected $table = 'financial_status_histories';

    protected $fillable = [
        'student_id',
        'previous_status',
        'new_status',
        'notes',
        'operator_name',
        'updated_by_user_id',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }
}
