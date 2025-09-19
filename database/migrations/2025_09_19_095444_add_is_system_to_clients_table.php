<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration{
  public function up():void{
    Schema::table('clients', function (Blueprint $table){
      $table->boolean('is_system')->default(false)->after('notes');
      // Evita dois "Consumidor" no mesmo usuário:
      $table->unique(['user_id','name']);
    });
  }
  public function down():void {
    Schema::table('clients', function (Blueprint $table){
      $table->dropUnique(['user_id','name']);
      $table->dropColumn('is_system');
    });
  }
};
