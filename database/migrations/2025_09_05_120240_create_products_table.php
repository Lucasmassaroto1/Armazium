<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration{
  public function up(): void{
    Schema::create('products', function (Blueprint $table){
      $table->id();
      $table->string('name');
      $table->string('sku')->unique();
      $table->string('category')->nullable();
      $table->unsignedInteger('stock')->default(0);
      $table->unsignedInteger('min_stock')->default(0);
      $table->decimal('cost_price',10,2)->nullable();
      $table->decimal('sale_price',10,2)->nullable();
      $table->timestamps();
    });
  }
  public function down(): void{
    Schema::dropIfExists('products');
  }
};
