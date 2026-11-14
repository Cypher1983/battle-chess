<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| Existing tests are PHPUnit classes and keep working unchanged. New
| function-style Pest tests in these folders get the Laravel TestCase.
|
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Browser');

// The first page load of a run compiles views and boots the app server.
pest()->browser()->timeout(15_000);
