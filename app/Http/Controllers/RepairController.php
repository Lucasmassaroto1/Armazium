<?php

namespace App\Http\Controllers;

use App\Models\Repair;
use App\Models\Client;
use Illuminate\Http\Request;

class RepairController extends Controller{
  public function index(Request $request){
    $date = $request->query('date'); // YYYY-MM-DD

    $query = Repair::query()
      ->with('client')
      ->where('representative_id', auth()->id());

    if($date){
      $query->whereDate('created_at', $date);
      // Se sua tabela tiver 'received_at', e você quiser usar:
      // $query->where(function($q) use ($date){
      //   $q->whereDate('received_at', $date)->orWhereDate('created_at', $date);
      // });
    }else{
      $today = now()->toDateString();
      $query->whereDate('created_at', $today);
    }

    $items = $query->orderByDesc('id')->get()->map(function($r){
      return [
        'id' => $r->id,
        'client' => optional($r->client)->name,
        'device' => $r->device,
        'status' => $r->status,
        'price' => $r->price ? (float)$r->price : null,
        'created_at' => optional($r->created_at)?->format('d/m/Y H:i'),
      ];
    });

    return response()->json(['data' => $items]);
  }

  public function store(Request $request){
    $data = $request->validate([
      'client_id' => ['required','exists:clients,id'],
      'device' => ['required','string','max:120'],
      'issue' => ['nullable','string','max:2000'],
      'price' => ['nullable','numeric','min:0'],
      'status' => ['nullable','in:open,in_progress,done,canceled'],
      'received_at' => ['nullable','date'],
    ]);

    // Cliente pertence ao representante logado
    $client = Client::where('id', $data['client_id'])
    ->where(function ($q) {
      $q->where('user_id', auth()->id())
        ->orWhere('is_system', true);
    })
    ->first();

    if(!$client){
      abort(403, 'Cliente não pertence a você.');
    }

    $repair = Repair::create([
      'representative_id' => auth()->id(),
      'client_id' => $data['client_id'],
      'device' => $data['device'],
      'problem_description' => $data['issue'] ?? '',
      'price' => $data['price'] ?? null,
      'status' => $data['status'] ?? 'open',
      'received_at' => $data['received_at'] ?? now(),
    ]);

    if($request->expectsJson()){
      return response()->json(['data' => ['id' => $repair->id]], 201);
    }
    return redirect('/repairs')->with('success', 'Manutenção registrada!');
  }

  public function show(Repair $repair){
    abort_if($repair->representative_id !== auth()->id(), 403);

    $repair->load('client');

    return response()->json([
      'data' => [
        'id' => $repair->id,
        'client' => optional($repair->client)->name,
        'device' => $repair->device,
        'issue' => $repair->problem_description,
        'price' => $repair->price ? (float)$repair->price : null,
        'status' => $repair->status,
        'received_at' => optional($repair->received_at)?->format('d/m/Y'),
        'created_at' => optional($repair->created_at)?->format('d/m/Y H:i'),
      ],
    ]);
  }

  public function update(Request $request, Repair $repair){
    abort_if($repair->representative_id !== auth()->id(), 403);

    $data = $request->validate([
      'status' => ['required','in:open,in_progress,done,canceled'],
    ]);

    $repair->update([
      'status' => $data['status'],
    ]);

    if($request->expectsJson()){
      return response()->json(['data' => true]);
    }
    return redirect('/repairs')->with('success', 'Manutenção atualizada!');
  }

  public function destroy(Repair $repair){
    abort_if($repair->representative_id !== auth()->id(), 403);

    $repair->delete();

    if(request()->expectsJson()){
      return response()->json(['data' => true]);
    }
    return redirect('/repairs')->with('success', 'Manutenção excluída!');
  }
}
