<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\User;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\Request;
use App\Http\Requests\ClientStoreRequest;
use App\Http\Requests\ClientUpdateRequest;

class ClientController extends Controller{
  public function index(Request $request){
    $this->ensureGlobalConsumer();

    $per = (int)$request->query('per_page', 50);
    $q = trim((string)$request->query('q', ''));

    $query = Client::query()
      ->where(function($w){
        $w->where('user_id', auth()->id())
          ->orWhere('is_system', true);
      })->orderBy('name');

    if($q !== ''){
      $query->where(function ($w) use ($q){
        $w->where('name','like',"%{$q}%")
          ->orWhere('email','like',"%{$q}%")
          ->orWhere('phone','like',"%{$q}%");
      });
    }

    $paginator = $query->paginate($per)->appends($request->query());

    return response()->json([
      'data' => $paginator->items(),
      'meta' => [
        'current_page' => $paginator->currentPage(),
        'per_page' => $paginator->perPage(),
        'total' => $paginator->total(),
        'last_page' => $paginator->lastPage(),
      ],
    ]);
  }

  public function show(Client $client){
    abort_if($client->user_id !== auth()->id() && !$client->is_system, 403);
    return response()->json(['data' => $client]);
  }

  public function store(ClientStoreRequest $request){
    $payload = $request->validated();
    $payload['user_id'] = auth()->id();
    if(strcasecmp($payload['name'] ?? '', 'Consumidor') === 0){
      throw ValidationException::withMessages([
        'name' => 'O nome "Consumidor" é reservado pelo sistema.',
      ]);
    }
    $client = Client::create($payload);

    if($request->expectsJson()){
      return response()->json(['data' => $client], 201);
    }
    return redirect('/clients')->with('success', 'Cliente criado!');
  }

  public function update(ClientUpdateRequest $request, Client $client){
    abort_if($client->user_id !== auth()->id() && !$client->is_system, 403);

    $client->update($request->validated());
    return $request->expectsJson()
      ? response()->json(['data' => $client])
      : redirect('/clients')->with('success', 'Cliente atualizado!');
  }

  private function ensureGlobalConsumer(): void{
    if(Client::where('is_system', true)->where('name','Consumidor')->exists()){
      return;
    }

    $ownerId = User::where('role','admin')->value('id') ?? User::min('id') ?? auth()->id();

    if(!$ownerId) return;

    Client::create([
      'user_id' => $ownerId,
      'name' => 'Consumidor',
      'notes' => 'Cliente padrão criado automaticamente pelo sistema.',
      'is_system' => true,
    ]);
  }

  public function destroy(Client $client){
    abort_if($client->user_id !== auth()->id() && !$client->is_system, 403);

    if($client->is_system){
      abort(403, 'O Cliente padrão "Consumidor" não pode ser deletado.');
    }

    $client->delete();
    return request()->expectsJson()
      ? response()->json(['data' => true])
      : redirect('/clients')->with('success', 'Cliente excluído!');
  }
}