<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\RepairController;

// ============ ROTA LOGIN ============
Route::get('/login', fn() => view('login'))->name('login');
Route::get('/register', fn() => view('register'));

// ============ AUTENTICAÇÃO ============
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout')->middleware('auth');

// ============ ROTA PÁGINAS SE LOGADO ============
Route::middleware('auth')->group(function () {
  // ============ ROTAS HOME ============
  Route::get('/', fn() => view('home'));
  Route::get('/dashboard/metrics', [DashboardController::class, 'index'])->name('dashboard.metrics');

  // ============ ROTAS PRODUTOS ============
  Route::get('/products', fn() => view('products'));
  Route::get('/products/list', [ProductController::class, 'index'])->name('products.list');
  Route::post('/products', [ProductController::class, 'store'])->name('products.store');
  Route::put('/products/{product}', [ProductController::class, 'update'])->name('products.update');
  Route::delete('/products/{product}', [ProductController::class, 'destroy'])->name('products.destroy');
  
  // ============ ROTAS CLIENTES ============
  Route::get('/clients', fn() => view('clients'));
  Route::get('/clients/list', [ClientController::class, 'index'])->name('clients.list');
  Route::post('/clients', [ClientController::class, 'store'])->name('clients.store');
  Route::put('/clients/{client}', [ClientController::class, 'update'])->name('clients.update');
  Route::delete('/clients/{client}', [ClientController::class, 'destroy'])->name('clients.destroy');

  // ============ ROTAS VENDAS ============
  Route::get('/sales', fn() => view('sales'));
  Route::get('/sales/list', [SaleController::class, 'index'])->name('sales.list');
  Route::post('/sales', [SaleController::class, 'store'])->name('sales.store');
  Route::put('/sales/{sale}', [SaleController::class, 'update'])->name('sales.update');
  Route::delete('/sales/{sale}', [SaleController::class, 'destroy'])->name('sales.destroy');
  Route::get('/sales/{sale}', [SaleController::class, 'show'])->name('sales.show');

  // ============ ROTAS MANUTENÇÕES ============
  Route::get('/repairs', fn() => view('repairs'));
  Route::get('/repairs/list', [RepairController::class, 'index'])->name('repairs.list');
  Route::post('/repairs', [RepairController::class, 'store'])->name('repairs.store');
  Route::put('/repairs/{repair}', [\App\Http\Controllers\RepairController::class, 'update'])->name('repairs.update');
  Route::delete('/repairs/{repair}', [\App\Http\Controllers\RepairController::class, 'destroy'])->name('repairs.destroy');
  Route::get('/repairs/{repair}', [\App\Http\Controllers\RepairController::class, 'show'])->name('repairs.show');
  
  Route::get('/me', function (){
    return response()->json([
      'ok'   => true,
      'user' => Auth::user(),
    ]);
  });
});