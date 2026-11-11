<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    /**
     * Display a listing of staff and admin users with their RFID cards.
     */
    public function index(): JsonResponse
    {
        $users = User::latest()->get();

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    /**
     * Display the specified user by ID or RFID UID.
     */
    public function show(string $identifier): JsonResponse
    {
        $user = User::where('id', $identifier)
            ->orWhere('rfid_uid', $identifier)
            ->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    /**
     * Assign or update an RFID card UID for a user.
     */
    public function assignRfid(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'rfid_uid' => ['required', 'string', 'max:64', 'unique:users,rfid_uid,' . $user->id],
        ], [
            'rfid_uid.unique' => 'This RFID card is already assigned to another staff member.',
            'rfid_uid.required' => 'RFID UID is required.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'RFID validation error.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $cleanUid = trim(strtoupper($request->rfid_uid));

        // Check cross-entity conflict with student RFID cards
        $studentConflict = Student::where('rfid_uid', $cleanUid)->first();
        if ($studentConflict) {
            return response()->json([
                'success' => false,
                'message' => "This RFID card is already assigned to student {$studentConflict->first_name} {$studentConflict->last_name} ({$studentConflict->student_number}).",
                'errors' => [
                    'rfid_uid' => ["RFID UID is already paired with student {$studentConflict->student_number}."],
                ],
            ], 422);
        }

        $user->update([
            'rfid_uid' => $cleanUid,
        ]);

        return response()->json([
            'success' => true,
            'message' => "RFID card [{$cleanUid}] successfully paired to {$user->name}.",
            'data' => $user->fresh(),
        ]);
    }

    /**
     * Unpair / remove the RFID card from a user.
     */
    public function unassignRfid(int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found.',
            ], 404);
        }

        $oldUid = $user->rfid_uid;
        $user->update(['rfid_uid' => null]);

        return response()->json([
            'success' => true,
            'message' => "RFID card [{$oldUid}] unpaired from {$user->name}.",
            'data' => $user->fresh(),
        ]);
    }
}
