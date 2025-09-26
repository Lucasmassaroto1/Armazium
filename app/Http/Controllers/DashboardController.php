<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Sale;
use App\Models\Repair;
use App\Models\Product;

class DashboardController extends Controller{
  public function index(){
    $today = now()->toDateString();

    $salesToday = Sale::where('status', 'paid')
    ->where(function($q) use ($today){
      $q->whereDate('sold_at', $today)
        ->orWhereDate('created_at', $today);
    })
    ->count();

    $repairsToday = Repair::where('status', 'done')
      ->where(function($q) use ($today){
        $q->whereDate('delivered_at', $today)
          ->orWhereDate('updated_at', $today);
      })
      ->count();

    $salesRevenueToday = (float) Sale::where('status', 'paid')
      ->where(function($q) use ($today){
        $q->whereDate('sold_at', $today)
          ->orWhereDate('created_at', $today);
      })
      ->sum('total_amount');

    $repairsRevenueToday = (float) Repair::where('status', 'done')
      ->where(function($q) use ($today){
        $q->whereDate('delivered_at', $today)
          ->orWhereDate('updated_at', $today);
      })
      ->sum('price');

    $revenueToday = $salesRevenueToday + $repairsRevenueToday;

    $lowStockCount = Product::whereColumn('stock','<','min_stock')->count();

    return response()->json([
      'salesToday' => $salesToday,
      'repairsToday' => $repairsToday,
      'revenueToday' => $revenueToday,
      'lowStockCount' => $lowStockCount,
    ]);
  }
}
