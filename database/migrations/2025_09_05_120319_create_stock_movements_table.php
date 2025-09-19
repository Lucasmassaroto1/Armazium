<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration{
  public function up(): void{
    Schema::create('stock_movements', function (Blueprint $table){
      $table->id();
      $table->foreignId('product_id')->constrained()->cascadeOnDelete();
      $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // quem registrou
      $table->enum('type', ['in','out','adjust']);
      $table->integer('quantity');
      $table->string('reason')->nullable();
      $table->timestamps();
    });
  }
  public function down(): void{
    Schema::dropIfExists('stock_movements');
  }
};
