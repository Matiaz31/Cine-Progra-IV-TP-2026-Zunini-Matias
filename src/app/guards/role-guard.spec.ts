import { CanActivateFn } from '@angular/router';
import { roleGuard } from './role-guard';

describe('roleGuard', () => {
  it('should create a guard for the allowed roles', () => {
    const guard: CanActivateFn = roleGuard(['admin']);

    expect(guard).toBeTruthy();
    expect(typeof guard).toBe('function');
  });
});
