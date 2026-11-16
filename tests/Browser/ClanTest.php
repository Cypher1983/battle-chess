<?php

use App\Enums\EmblemIcon;
use App\Enums\EmblemShape;
use App\Models\Clan;
use App\Models\ClanInvitation;
use App\Models\User;

it('founds a clan with a custom emblem', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    visit('/clan')
        ->assertSee('Found a clan')
        ->type('#clan-name', 'Iron Ring')
        ->type('#clan-tag', 'iron')
        ->click('@emblem-shape-hex')
        ->click('@emblem-icon-wolf')
        ->click('@save-clan-button')
        ->assertSee('Clan founded')
        ->assertSee('Iron Ring')
        ->assertSee('[IRON]')
        ->assertSee('You lead this clan.')
        ->assertNoJavaScriptErrors();

    $clan = Clan::sole();
    expect($clan->leader->is($user))->toBeTrue()
        ->and($clan->emblem_shape)->toBe(EmblemShape::Hex)
        ->and($clan->emblem_icon)->toBe(EmblemIcon::Wolf);
});

it('invites a player who then joins', function () {
    $clan = Clan::factory()->create(['name' => 'Iron Ring', 'tag' => 'IRON']);
    $player = User::factory()->create(['username' => 'rook_runner']);

    $this->actingAs($clan->leader);

    visit('/clan')
        ->type('#invite-username', 'rook_runner')
        ->click('@send-clan-invitation-button')
        ->assertSee('Invitation sent')
        ->assertSee('@rook_runner')
        ->assertNoJavaScriptErrors();

    expect(ClanInvitation::sole()->invitee->is($player))->toBeTrue();

    $this->actingAs($player);

    visit('/clan')
        ->assertSee('Clan invitations')
        ->click('@accept-clan-invitation-button')
        ->assertSee('Welcome to Iron Ring!')
        ->assertSee('Members')
        ->assertSee('Leave clan')
        ->assertNoJavaScriptErrors();

    expect($player->refresh()->clan_id)->toBe($clan->id);
});

it('shows the clan rankings to signed-in players', function () {
    $clan = Clan::factory()->create(['name' => 'Iron Ring', 'tag' => 'IRON']);
    $clan->leader->forceFill(['wins' => 2])->save();

    $this->actingAs(User::factory()->create());

    visit('/scoreboard')
        ->click('@scoreboard-tab-clans')
        ->assertSee('Clan rankings')
        ->assertSee('Iron Ring')
        ->assertNoJavaScriptErrors();
});
