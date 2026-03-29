import { renderHook, act } from '@testing-library/react';
import useYearStore from './useYearStore';
import { expect, test, describe, beforeEach } from 'vitest';

describe('useYearStore', () => {
  beforeEach(() => {
    act(() => {
      useYearStore.getState().resetState();
      useYearStore.getState().setDefaultCountries(['FRA']);
    });
  });

  test('toggleCountry should add a country if not selected', () => {
    act(() => {
      useYearStore.getState().toggleCountry('USA');
    });
    expect(useYearStore.getState().countrySelection).toContain('USA');
  });

  test('toggleCountry with isCtrlKey should clear other selections', () => {
    act(() => {
      useYearStore.getState().toggleCountry('USA', true);
    });
    expect(useYearStore.getState().countrySelection).toEqual(['USA']);
  });
});
