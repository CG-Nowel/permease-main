<?php

use App\Http\Controllers\Api\AcademicTermController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PromissoryController;
use App\Http\Controllers\Api\ReprintController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application.
|
*/

// Authentication & RFID Tap Login
Route::post('/login', [AuthController::class, 'login']);
Route::post('/login/rfid', [AuthController::class, 'rfidLogin']);
Route::post('/auth/rfid-login', [AuthController::class, 'rfidLogin']);
Route::get('/user', [AuthController::class, 'me']);

// User Management & Staff RFID Card Pairing
Route::prefix('users')->group(function () {
    Route::get('/', [UserController::class, 'index']);
    Route::get('/{identifier}', [UserController::class, 'show']);
    Route::post('/{id}/rfid', [UserController::class, 'assignRfid']);
    Route::delete('/{id}/rfid', [UserController::class, 'unassignRfid']);
});

Route::prefix('students')->group(function () {
    Route::get('/', [StudentController::class, 'index']);
    Route::post('/', [StudentController::class, 'store']);
    Route::get('/{identifier}', [StudentController::class, 'show']);
    Route::put('/{id}', [StudentController::class, 'update']);
    Route::post('/{id}/billing-status', [StudentController::class, 'updateBillingStatus']);
    Route::get('/{id}/clearance-history', [StudentController::class, 'clearanceHistory']);
    Route::get('/{identifier}/permit-pdf', [\App\Http\Controllers\Api\PermitPdfController::class, 'generatePdf']);
});

// Permit Reprint Authorizations & Transactions Ledger
Route::prefix('reprints')->group(function () {
    Route::get('/', [ReprintController::class, 'index']);
    Route::post('/', [ReprintController::class, 'store']);
    Route::post('/{id}/consume', [ReprintController::class, 'consume']);
});

// Promissory Notes Management (Filing by Registrar, Clearance by Accounting)
Route::prefix('promissory-requests')->group(function () {
    Route::get('/', [PromissoryController::class, 'index']);
    Route::post('/', [PromissoryController::class, 'store']);
    Route::get('/{identifier}', [PromissoryController::class, 'show']);
    Route::post('/{id}/approve', [PromissoryController::class, 'approve']);
    Route::post('/{id}/reject', [PromissoryController::class, 'reject']);
});

// Academic Terms Management (School Year and Semester)
Route::prefix('academic-terms')->group(function () {
    Route::get('/', [AcademicTermController::class, 'index']);
    Route::post('/', [AcademicTermController::class, 'store']);
    Route::post('/set-active', [AcademicTermController::class, 'setActive']);
});


