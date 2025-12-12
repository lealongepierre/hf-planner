import { describe, it, expect, beforeEach } from 'vitest';
import { authUtils } from './auth';

describe('authUtils', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.removeItem('hf_access_token');
  });

  describe('getToken', () => {
    it('test_get_token_when_not_set_returns_null', () => {
      expect(authUtils.getToken()).toBeNull();
    });

    it('test_get_token_when_set_returns_token', () => {
      localStorage.setItem('hf_access_token', 'test_token_123');
      expect(authUtils.getToken()).toBe('test_token_123');
    });
  });

  describe('setToken', () => {
    it('test_set_token_stores_token_in_localstorage', () => {
      authUtils.setToken('new_token_456');
      expect(localStorage.getItem('hf_access_token')).toBe('new_token_456');
    });

    it('test_set_token_overwrites_existing_token', () => {
      authUtils.setToken('old_token');
      authUtils.setToken('new_token');
      expect(localStorage.getItem('hf_access_token')).toBe('new_token');
    });
  });

  describe('clearToken', () => {
    it('test_clear_token_removes_token_from_localstorage', () => {
      localStorage.setItem('hf_access_token', 'token_to_clear');
      authUtils.clearToken();
      expect(localStorage.getItem('hf_access_token')).toBeNull();
    });

    it('test_clear_token_when_no_token_does_not_error', () => {
      expect(() => authUtils.clearToken()).not.toThrow();
      expect(localStorage.getItem('hf_access_token')).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('test_is_authenticated_returns_false_when_no_token', () => {
      expect(authUtils.isAuthenticated()).toBe(false);
    });

    it('test_is_authenticated_returns_true_when_token_exists', () => {
      authUtils.setToken('valid_token');
      expect(authUtils.isAuthenticated()).toBe(true);
    });

    it('test_is_authenticated_returns_false_after_clearing_token', () => {
      authUtils.setToken('token');
      expect(authUtils.isAuthenticated()).toBe(true);
      authUtils.clearToken();
      expect(authUtils.isAuthenticated()).toBe(false);
    });
  });
});
