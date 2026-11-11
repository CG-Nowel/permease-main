<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Standard email/password login.
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password.',
            ], 401);
        }

        $token = 'permease_token_' . Str::random(40);

        return response()->json([
            'success' => true,
            'message' => 'Logged in successfully.',
            'token' => $token,
            'user' => $user,
        ]);
    }

    /**
     * Touchless RFID card login for staff / administrator.
     */
    public function rfidLogin(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'rfid_uid' => ['required', 'string', 'max:64'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Please provide a valid RFID card UID.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $cleanUid = trim(strtoupper($request->rfid_uid));

        $user = User::where('rfid_uid', $cleanUid)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unrecognized RFID Card. No staff account is associated with this card.',
                'rfid_uid' => $cleanUid,
            ], 404);
        }

        $token = 'permease_token_' . Str::random(40);

        return response()->json([
            'success' => true,
            'message' => "Welcome back, {$user->name}!",
            'token' => $token,
            'user' => $user,
        ]);
    }

    /**
     * Return currently authenticated user profile.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user() ?? User::first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'user' => $user,
        ]);
    }
}
