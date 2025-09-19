<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Client;

class DefaultConsumerSeeder extends Seeder{
  public function run():void{
    if(Client::where('is_system', true)->where('name','Consumidor')->exists()){
      return;
    }

    $ownerId = User::where('role','admin')-value('id') ?? User::min('id');
    if(!$ownerId) return;

    Client::create([
      'user_id' => $ownerId, 
      'name' => 'Consumidor',
      'notes' => 'Cliente padrão criado automaticamente pelo sistema.', 
      'is_system' => true,
    ]);
  }
}
