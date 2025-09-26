<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductUpdateRequest extends FormRequest{
  public function authorize(): bool{
    return true;
  }

  public function rules(): array{
    return[
      'name' => ['sometimes','required','string','max:255'],
      'sku' => ['sometimes','required','string','max:255', Rule::unique('products','sku')->ignore($this->route('product'))],
      'category' => ['nullable','string','max:255'],
      'stock' => ['nullable','integer','min:0'],
      'min_stock'  => ['nullable','integer','min:0'],
      'cost_price' => ['nullable','numeric','min:0'],
      'sale_price' => ['nullable','numeric','min:0'],
      'active' => ['boolean'],
    ];
  }
}
