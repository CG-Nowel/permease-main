<?php

use Illuminate\Support\Facades\Route;

Route::get('/permits/{identifier}/pdf', [\App\Http\Controllers\Api\PermitPdfController::class, 'generatePdf']);
Route::get('/permits/{identifier}/print', [\App\Http\Controllers\Api\PermitPdfController::class, 'printView']);

Route::get('/{any?}', function () {
    return view('app');
})->where('any', '.*');
