<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model{
  use HasFactory;

  protected $fillable =[
    'name',
    'sku',
    'category',
    'stock',
    'min_stock',
    'cost_price',
    'sale_price',
    'active'
  ];

  protected $casts =[
    'cost_price' => 'decimal:2',
    'sale_price' => 'decimal:2',
    'active' => 'boolean',
    'created_at' => 'datetime',
    'updated_at' => 'datetime',
  ];

  public function saleItems(){
    return $this->hasMany(SaleItem::class);
  }
}
