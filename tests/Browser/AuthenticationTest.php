<?php

use App\Models\User;

it('registers a new player with a username', function () {
    $page = visit('/register');

    $page->fill('name', 'Ada Lovelace')
        ->fill('username', 'Ada_Engine')
        ->fill('email', 'ada@example.com')
        ->fill('password', 'correct-horse-battery')
        ->fill('password_confirmation', 'correct-horse-battery')
        ->click('@register-user-button')
        ->assertPathIs('/email/verify')
        ->assertNoJavaScriptErrors();

    expect(User::sole())
        ->username->toBe('ada_engine')
        ->email->toBe('ada@example.com');
});

it('logs in with a username', function () {
    User::factory()->create(['username' => 'knight_rider']);

    visit('/login')
        ->fill('login', 'Knight_Rider')
        ->fill('password', 'password')
        ->click('@login-button')
        ->assertPathIs('/dashboard')
        ->assertSee('Welcome back')
        ->assertNoJavaScriptErrors();
});

it('shows an error for a wrong password', function () {
    User::factory()->create(['username' => 'knight_rider']);

    visit('/login')
        ->fill('login', 'knight_rider')
        ->fill('password', 'wrong-password')
        ->click('@login-button')
        ->assertPathIs('/login')
        ->assertSee('These credentials do not match our records');
});
