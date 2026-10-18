import { defaultFilters, exampleFilters, type Filters } from '../src';

type Patch = (f: Filters) => void;
const make = (patch: Patch, base = defaultFilters): Filters => {
  const f = base();
  patch(f);
  return f;
};

const KIRCHBERG = { lat: 49.6261, lon: 6.161, label: 'Kirchberg' };
const HAMILIUS = { lat: 49.6109, lon: 6.1262, label: 'Hamilius' };
const GARE = { lat: 49.5999, lon: 6.1338, label: 'Gare' };
const CLOCHE_DOR = { lat: 49.5803, lon: 6.1135, label: "Cloche d'Or" };
const GRUND = { lat: 49.6098, lon: 6.1377, label: 'Grund' };
const HOWALD = { lat: 49.5822, lon: 6.1426, label: 'Howald' };
const BELVAL = { lat: 49.5025, lon: 5.9435, label: 'Belval (outside the grid)' };

export const SCENARIOS: Record<string, Filters> = {
  'load an example (prototype button)': exampleFilters(),

  'no filters, size 30 m²': make((f) => {
    f.size = 30;
  }),

  'two people, transit + bike, rail noise, schools near, 80 m² no budget': make((f) => {
    f.people = [
      { label: 'Person 1', dest: GARE, mode: 'transit', max: 35 },
      { label: 'Person 2', dest: CLOCHE_DOR, mode: 'bike', max: 20 },
    ];
    f.arrive = 8;
    f.size = 80;
    f.noise.rail = 60;
    f.cats.school = { mode: 'near', m: 500 };
  }),

  'walk only, nightlife at least 300 m, pharmacy within 600 m, arrive 9:00': make((f) => {
    f.people = [{ label: 'Person 1', dest: HAMILIUS, mode: 'walk', max: 25 }];
    f.arrive = 9;
    f.cats.nightlife = { mode: 'far', m: 300 };
    f.cats.pharmacy = { mode: 'near', m: 600 };
  }),

  'bike uphill to Kirchberg + walk down to Grund, arrive 7:30, budget 2000 / 120 m²': make((f) => {
    f.people = [
      { label: 'Person 1', dest: KIRCHBERG, mode: 'bike', max: 15 },
      { label: 'Person 2', dest: GRUND, mode: 'walk', max: 40 },
    ];
    f.arrive = 7.5;
    f.budget = 2000;
    f.size = 120;
  }),

  'strict noise (55 dB everywhere), transit to Howald 7:30, budget 1800 / 45 m²': make((f) => {
    f.people = [{ label: 'Person 1', dest: HOWALD, mode: 'transit', max: 45 }];
    f.arrive = 7.5;
    f.noise = { road: 55, rail: 55, air: 55 };
    f.budget = 1800;
    f.size = 45;
  }),

  'all categories near/far + two custom places, budget 3200 / 100 m², transit 9:00': make((f) => {
    f.people = [
      { label: 'Person 1', dest: KIRCHBERG, mode: 'transit', max: 40 },
      { label: 'Person 2', dest: null, mode: 'walk', max: 30 },
    ];
    f.arrive = 9;
    f.budget = 3200;
    f.size = 100;
    f.noise.road = 70;
    f.cats = {
      supermarket: { mode: 'near', m: 500 },
      pharmacy: { mode: 'near', m: 800 },
      hospital: { mode: 'far', m: 300 },
      school: { mode: 'near', m: 1000 },
      nursery: { mode: 'near', m: 700 },
      afterschool: { mode: 'near', m: 1000 },
      university: { mode: 'near', m: 3000 },
      park: { mode: 'near', m: 400 },
      gym: { mode: 'far', m: 200 },
      nightlife: { mode: 'far', m: 400 },
      bikeshare: { mode: 'near', m: 300 },
    };
    f.places = [
      { name: 'Family', loc: { lat: 49.63, lon: 6.12 }, mode: 'near', m: 3000 },
      { name: 'Airport', loc: { lat: 49.6266, lon: 6.2115 }, mode: 'far', m: 4000 },
      { name: 'Not set yet', loc: null, mode: 'near', m: 1000 },
    ];
  }),

  'budget without size (colours by €/m² at 60 m²), bike to a destination outside the grid': make(
    (f) => {
      f.people = [{ label: 'Person 1', dest: BELVAL, mode: 'bike', max: 60 }];
      f.budget = 2000;
      f.cats.park = { mode: 'near', m: 300 };
    },
  ),

  'transit 8:00 to the station, at least 1 km from a custom place': make((f) => {
    f.people = [{ label: 'Person 1', dest: GARE, mode: 'transit', max: 25 }];
    f.arrive = 8;
    f.size = 70;
    f.budget = 2400;
    f.places = [{ name: 'Old flat', loc: { lat: 49.62, lon: 6.14 }, mode: 'far', m: 1000 }];
  }),
};
