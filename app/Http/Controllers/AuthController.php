<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AuthController extends Controller{
  private const STRONG_PASS = '/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/';

  public function register(Request $request){
    $data = $request->validate([
      'name' => 'required|string|max:255',
      'email' => ['required','email','max:255', Rule::unique('users')],
      'password' => ['required','regex:'.self::STRONG_PASS],
    ]);

    $user = User::create([
      'name' => $data['name'],
      'email' => $data['email'],
      'password' => Hash::make($data['password']),
      'role' => 'rep',
    ]);

    Auth::login($user);

    return response()->json(['ok' => true, 'user' => $user], 201);
  }

  public function login(Request $request){
    $credentials = $request->validate([
      'email' => 'required|email',
      'password' => 'required',
    ]);

    if(!Auth::attempt($credentials)){
      return response()->json(['ok' => false, 'message' => 'Credenciais inválidas'], 401);
    }

    $request->session()->regenerate();

    return response()->json(['ok' => true, 'user' => Auth::user()]);
  }

  public function logout(Request $request){
    Auth::logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return response()->json(['ok' => true]);
  }
}