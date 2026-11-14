<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Fortify\Features;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->skipUnlessFortifyHas(Features::registration());
    }

    public function test_registration_screen_can_be_rendered()
    {
        $response = $this->get(route('register'));

        $response->assertOk();
    }

    public function test_new_users_can_register()
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Test User',
            'username' => 'test_user',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_username_is_stored_in_lowercase()
    {
        $this->post(route('register.store'), $this->validData(['username' => '  Knight_Rider ']));

        $this->assertDatabaseHas('users', ['username' => 'knight_rider']);
    }

    public function test_username_is_required()
    {
        $response = $this->post(route('register.store'), $this->validData(['username' => '']));

        $response->assertSessionHasErrors('username');
        $this->assertGuest();
    }

    public function test_username_must_be_unique_ignoring_case()
    {
        User::factory()->create(['username' => 'knight_rider']);

        $response = $this->post(route('register.store'), $this->validData(['username' => 'Knight_Rider']));

        $response->assertSessionHasErrors('username');
        $this->assertGuest();
    }

    /**
     * @return array<string, array{0: string}>
     */
    public static function invalidUsernames(): array
    {
        return [
            'too short' => ['ab'],
            'too long' => [str_repeat('a', 31)],
            'contains spaces' => ['knight rider'],
            'contains symbols' => ['knight-rider!'],
        ];
    }

    #[DataProvider('invalidUsernames')]
    public function test_invalid_usernames_are_rejected(string $username)
    {
        $response = $this->post(route('register.store'), $this->validData(['username' => $username]));

        $response->assertSessionHasErrors('username');
        $this->assertGuest();
    }

    /**
     * @param  array<string, string>  $overrides
     * @return array<string, string>
     */
    private function validData(array $overrides = []): array
    {
        return [
            'name' => 'Test User',
            'username' => 'test_user',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            ...$overrides,
        ];
    }
}
