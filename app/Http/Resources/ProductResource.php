<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource{
  public function toArray($request): array{
    return[
      'id' => $this->id,
      'name' => $this->name,
      'sku' => $this->sku,
      'category' => $this->category,
      'stock' => $this->stock,
      'min_stock' => $this->min_stock,
      'cost_price' => $this->cost_price? (float)$this->cost_price : null,
      'sale_price' => $this->sale_price? (float)$this->sale_price : null,
      'active' => (bool)$this->active,
      'created_at' => $this->created_at,
      'updated_at' => $this->updated_at,
    ];
  }
}
