<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Repair extends Model{
  use HasFactory;

  protected $fillable =[
    'representative_id',
    'client_id',
    'device',
    'problem_description',
    'status',
    'price',
    'started_at',
    'ready_at',
    'delivered_at',
  ];

  protected $casts =[
    'price' => 'decimal:2',
    'started_at' => 'datetime',
    'ready_at' => 'datetime',
    'delivered_at'=> 'datetime',
  ];

  public function representative(){
    return $this->belongsTo(User::class,'representative_id');
  }

  public function client(){
    return $this->belongsTo(Client::class);
  }
}
