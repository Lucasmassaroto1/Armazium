<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration{
  public function up(): void{
    Schema::table('sales', function (Blueprint $table){
      if(!Schema::hasColumn('sales', 'sold_at')){
        $table->dateTime('sold_at')->nullable()->after('status');
      }
    });
  }

  public function down(): void{
    Schema::table('sales', function (Blueprint $table){
      if(Schema::hasColumn('sales', 'sold_at')){
        $table->dropColumn('sold_at');
      }
    });
  }
};
