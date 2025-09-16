<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;
use App\Http\Requests\ClientStoreRequest;
use App\Http\Requests\ClientUpdateRequest;

class ClientController extends Controller{
  public function index(Request $request){
    $per = (int)$request->query('per_page', 50);
    $q = trim((string)$request->query('q', ''));

    $query = Client::query()
      ->where('user_id', auth()->id()) // mostra somente os clientes do representante
      ->orderBy('name');

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
    abort_if($client->user_id !== auth()->id(), 403);
    return response()->json(['data' => $client]);
  }

  public function store(ClientStoreRequest $request){
    $payload = $request->validated();
    $payload['user_id'] = auth()->id();
    $client = Client::create($payload);

    if($request->expectsJson()){
      return response()->json(['data' => $client], 201);
    }
    return redirect('/clients')->with('success', 'Cliente criado!');
  }

  public function update(ClientUpdateRequest $request, Client $client){
    abort_if($client->user_id !== auth()->id(), 403);

    $client->update($request->validated());

    if($request->expectsJson()){
      return response()->json(['data' => $client]);
    }
    return redirect('/clients')->with('success', 'Cliente atualizado!');
  }

  public function destroy(Client $client){
    abort_if($client->user_id !== auth()->id(), 403);

    $client->delete();

    if(request()->expectsJson()){
      return response()->json(['data' => true]);
    }
    return redirect('/clients')->with('success', 'Cliente excluído!');
  }
}