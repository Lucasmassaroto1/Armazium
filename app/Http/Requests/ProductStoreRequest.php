<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProductStoreRequest extends FormRequest{
  public function authorize(): bool{
    return true;
  } 

  public function rules(): array{
    return [
      'name' => ['required','string','max:255'],
      'sku' => ['required','string','max:255','unique:products,sku'],
      'category' => ['nullable','string','max:255'],
      'stock' => ['nullable','integer','min:0'],
      'min_stock' => ['nullable','integer','min:0'],
      'cost_price' => ['nullable','numeric','min:0'],
      'sale_price' => ['nullable','numeric','min:0'],
      'active' => ['boolean'],
    ];
  }
}
