<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration{
  public function up(): void{
    Schema::create('sales', function (Blueprint $table){
      $table->id();
      $table->foreignId('representative_id')->constrained('users')->cascadeOnDelete();
      $table->foreignId('client_id')->constrained()->cascadeOnDelete();
      $table->decimal('total_amount',10,2)->default(0);
      $table->enum('status', ['open','paid','canceled'])->default('open');
      $table->timestamps();
    });

    Schema::create('sale_items', function (Blueprint $table){
      $table->id();
      $table->foreignId('sale_id')->constrained('sales')->cascadeOnDelete();
      $table->foreignId('product_id')->constrained()->restrictOnDelete();
      $table->unsignedInteger('qty');
      $table->decimal('unit_price',10,2);
      $table->decimal('subtotal',10,2);
      $table->timestamps();
    });
  }
  public function down(): void{
    Schema::dropIfExists('sale_items');
    Schema::dropIfExists('sales');
  }
};
