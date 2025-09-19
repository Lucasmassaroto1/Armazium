<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Client extends Model{
  use HasFactory;

  protected $fillable = ['user_id','name','email','phone','notes','is_system'];

  public function user(){
    return $this->belongsTo(User::class);
  }

  public function sales(){
    return $this->hasMany(Sale::class);
  }

  public function repairs(){
    return $this->hasMany(Repair::class);
  }
}
