<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration{
  public function up(): void{
    Schema::create('repairs', function (Blueprint $table){
      $table->id();
      $table->foreignId('representative_id')->constrained('users')->cascadeOnDelete();
      $table->foreignId('client_id')->constrained()->cascadeOnDelete();
      $table->string('device')->nullable(); // notebook, desktop etc
      $table->text('problem_description')->nullable();
      $table->enum('status', ['open','in_progress','done','canceled'])->default('open');
      $table->decimal('price',10,2)->nullable();
      $table->timestamp('received_at')->nullable();
      $table->timestamp('delivered_at')->nullable();
      $table->timestamps();
    });
  }
  public function down(): void{
    Schema::dropIfExists('repairs');
  }
};