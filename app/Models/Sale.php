<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sale extends Model{
  use HasFactory;

  protected $fillable = ['representative_id','client_id','total_amount','status','sold_at'];

  protected $casts = [
      'total_amount' => 'decimal:2',
      'sold_at' => 'datetime',
  ];

  public function representative(){
    return $this->belongsTo(User::class,'representative_id');
  }

  public function client(){
    return $this->belongsTo(Client::class);
  }

  public function items(){
    return $this->hasMany(SaleItem::class);
  }

  public function recalcTotal(): void{
    $total = $this->items()->sum('subtotal');
    $this->update(['total_amount' => $total]);
  }
}
