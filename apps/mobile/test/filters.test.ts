import {
  CATS,
  MAX_PEOPLE,
  defaultFilters,
  exampleFilters,
  validateFilters,
  type Filters,
} from '@wtl/core';
import { describe, expect, it } from 'vitest';
import {
  activeCount,
  filtersKey,
  newPerson,
  newPlace,
  parseMax,
  parseMetres,
  parseOptional,
  pointLabel,
  restoreFilters,
  setCatMode,
  toEngineFilters,
} from '../src/lib/filters';
import { exampleEvaluation, getTestEngine } from './engine';

describe('input parsing (app.js rules)', () => {
  it('max minutes: +value || 30', () => {
    expect(parseMax('45')).toBe(45);
    expect(parseMax('')).toBe(30);
    expect(parseMax('0')).toBe(30);
    expect(parseMax('-10')).toBe(30);
    expect(parseMax('abc')).toBe(30);
    expect(parseMax(' 25 ')).toBe(25);
    expect(parseMax('22,5')).toBe(22.5);
  });
  it('budget and size: +value || null', () => {
    expect(parseOptional('2600')).toBe(2600);
    expect(parseOptional('')).toBeNull();
    expect(parseOptional('0')).toBeNull();
    expect(parseOptional('-5')).toBeNull();
    expect(parseOptional('1e999')).toBeNull();
  });
  it('metres: +value || 0, never negative', () => {
    expect(parseMetres('800')).toBe(800);
    expect(parseMetres('')).toBe(0);
    expect(parseMetres('-300')).toBe(0);
    expect(parseMetres('x')).toBe(0);
  });
  it('point label like pickOnMap', () => {
    expect(pointLabel(49.61234, 6.13)).toBe('Point 49.6123, 6.1300');
  });
});

describe('editing helpers', () => {
  it('"At least" turns the default 800 m into 300 m, other values stay', () => {
    expect(setCatMode({ mode: 'any', m: 800 }, 'far')).toEqual({ mode: 'far', m: 300 });
    expect(setCatMode({ mode: 'near', m: 500 }, 'far')).toEqual({ mode: 'far', m: 500 });
    expect(setCatMode({ mode: 'any', m: 800 }, 'near')).toEqual({ mode: 'near', m: 800 });
  });
  it('new person and place match the prototype defaults', () => {
    expect(newPerson(1)).toEqual({ label: 'Person 2', dest: null, mode: 'transit', max: 30 });
    expect(newPlace()).toEqual({ name: 'My place', loc: null, mode: 'near', m: 1000 });
  });
  it('counts active filters', () => {
    expect(activeCount(defaultFilters())).toBe(0);
    // 2 people, road + air noise, supermarket + park.
    expect(activeCount(exampleFilters())).toBe(6);
    const f = defaultFilters();
    f.places.push(newPlace()); // no location yet: not a check
    expect(activeCount(f)).toBe(0);
    f.places[0]!.loc = { lat: 49.6, lon: 6.1 };
    expect(activeCount(f)).toBe(1);
  });
});

describe('restoreFilters (saved state)', () => {
  it('round-trips the example through JSON', () => {
    const f = exampleFilters();
    expect(restoreFilters(JSON.parse(JSON.stringify(f)))).toEqual(f);
  });
  it('falls back to defaults for anything that is not an object', () => {
    for (const raw of [null, undefined, 42, 'x', []])
      expect(restoreFilters(raw)).toEqual(defaultFilters());
  });
  it('replaces malformed fields one by one', () => {
    const f = restoreFilters({
      people: [
        { dest: { lat: 'x', lon: 6 }, mode: 'car', max: -1 },
        { dest: { lat: 49.6, lon: 6.1, label: 'Work' }, mode: 'bike', max: 20 },
        { mode: 'walk' },
      ],
      arrive: 10,
      budget: -100,
      size: 55,
      noise: { road: 63, rail: 70, air: '55' },
      cats: { park: { mode: 'far', m: -5 }, gym: { mode: 'sometimes', m: 100 } },
      places: [{ name: '', loc: { lat: 200, lon: 0 }, mode: 'x', m: 'far' }, 3],
    });
    expect(f.people).toHaveLength(MAX_PEOPLE);
    expect(f.people[0]).toEqual({ label: 'Person 1', dest: null, mode: 'transit', max: 30 });
    expect(f.people[1]).toEqual({
      label: 'Person 2',
      dest: { lat: 49.6, lon: 6.1, label: 'Work' },
      mode: 'bike',
      max: 20,
    });
    expect(f.arrive).toBe(8.5);
    expect(f.budget).toBeNull();
    expect(f.size).toBe(55);
    expect(f.noise).toEqual({ road: 0, rail: 70, air: 0 });
    expect(f.cats.park).toEqual({ mode: 'far', m: 0 });
    expect(f.cats.gym).toEqual({ mode: 'any', m: 800 });
    expect(f.places).toEqual([{ name: 'My place', loc: null, mode: 'near', m: 1000 }]);
    expect(validateFilters(f)).toEqual([]);
  });
  it('an empty people list keeps the default person', () => {
    expect(restoreFilters({ people: [] }).people).toEqual(defaultFilters().people);
  });
});

describe('toEngineFilters (UI → engine adapter)', () => {
  it('fills blank labels and place names without touching the UI state', () => {
    const ui = defaultFilters();
    ui.people[0]!.label = '';
    ui.places.push({ name: '   ', loc: { lat: 49.6, lon: 6.12 }, mode: 'far', m: 300 });
    const before = JSON.stringify(ui);
    const f = toEngineFilters(ui);
    expect(f.people[0]!.label).toBe('Person 1');
    expect(f.places[0]!.name).toBe('My place');
    expect(JSON.stringify(ui)).toBe(before);
    expect(f).not.toBe(ui);
  });
  it('rejects values the engine would reject', () => {
    const f: Filters = defaultFilters();
    f.people[0]!.max = Number.NaN;
    expect(() => toEngineFilters(f)).toThrow(RangeError);
  });
  it('filtersKey changes only when the engine input changes', () => {
    const a = exampleFilters();
    const b = exampleFilters();
    expect(filtersKey(a)).toBe(filtersKey(b));
    b.cats.park.m = 600;
    expect(filtersKey(a)).not.toBe(filtersKey(b));
  });
  it('the example through the adapter evaluates like the example itself', () => {
    const engine = getTestEngine();
    const ev = exampleEvaluation();
    const direct = engine.evaluate(exampleFilters());
    expect(ev.filters).toEqual(exampleFilters());
    expect(ev.checks.map((c) => c.name)).toEqual(direct.checks.map((c) => c.name));
    expect(Array.from(ev.fails)).toEqual(Array.from(direct.fails));
    // 2 commutes + 2 noise + 2 categories.
    expect(ev.checks).toHaveLength(6);
    expect(CATS.filter(([k]) => ev.filters.cats[k].mode !== 'any')).toHaveLength(2);
  });
  it('async evaluation of the adapted filters matches the sync one', async () => {
    const engine = getTestEngine();
    const ui = exampleFilters();
    ui.people[1]!.mode = 'bike';
    const f = toEngineFilters(ui);
    const a = await engine.evaluateAsync(f, { pause: async () => {} });
    const b = engine.evaluate(f);
    expect(Array.from(a.fails)).toEqual(Array.from(b.fails));
  });
});
