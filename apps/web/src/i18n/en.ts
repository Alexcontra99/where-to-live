// English copy. Other locales (es, fr, de, it) copy this shape; `Dict` keeps them in sync.
import { SITE_NAME } from '../config';

export const en = {
  meta: {
    title: `${SITE_NAME} — find where to live before you move`,
    description:
      'Set your commutes, budget and what you want near or far. See which neighbourhoods fit, with commute times on real timetables, rent, noise and safety. Luxembourg demo live; iOS app coming.',
  },
  nav: {
    how: 'How it works',
    cities: 'Cities',
    data: 'Data',
    demo: 'Demo',
    join: 'Join the waitlist',
    skip: 'Skip to content',
  },
  hero: {
    title: 'Know where to live before you move.',
    lead: 'Tell it where you commute, what you can spend and what you want near or far. It maps the neighbourhoods that fit, with commute times on real timetables, rent, noise and safety, and shows what rules out the rest.',
    cta: 'Join the waitlist',
    demo: 'Try the Luxembourg demo',
    status: 'Luxembourg demo is live · iOS app coming · 7 more cities on the list',
    shotAlt:
      'The Luxembourg demo: a map of Luxembourg City with the areas that fit two commutes and a 2,600 € budget shaded green, and a panel listing Kirchberg, Limpertsberg and Belair with estimated rents and what blocks the grey areas.',
  },
  layers: {
    label: 'What goes into the map',
    items: [
      {
        id: 'commute',
        name: 'Commute',
        text: 'Door to door for up to two people, by public transport on official timetables, by bike or on foot. You set the longest trip you accept.',
        source: 'Luxembourg: Administration des transports publics timetables',
      },
      {
        id: 'rent',
        name: 'Rent',
        text: 'An estimate for your flat size in each neighbourhood, shaded against your budget. Rent never hides a zone; it colours it.',
        source: "Luxembourg: Observatoire de l'Habitat published rents",
      },
      {
        id: 'noise',
        name: 'Noise',
        text: 'Planes, trains and main roads, in plain words: avoid very loud, avoid loud, or don’t mind.',
        source: "Luxembourg: Administration de l'environnement noise maps",
      },
      {
        id: 'near',
        name: 'Near or far',
        text: 'Schools, childcare, supermarkets, parks, pharmacies, gyms, nightlife and your own places. You choose near or far, and how far.',
        source: 'OpenStreetMap, Overture Maps and official registers',
      },
      {
        id: 'safety',
        name: 'Safety',
        text: 'A neighbourhood label built from official police data where the city publishes it, with the source and its level of detail always shown.',
        source: 'Coming with the iOS app and the new cities',
      },
    ],
  },
  reason: {
    title: 'Every zone comes with its reason.',
    lead: 'Green means it fits everything you asked for. Grey means one filter away. The panel tells you which filter is blocking how much, so you know what to loosen.',
    points: [
      [
        'Ranked areas',
        'The neighbourhoods with the most matching space, with estimated rent for your flat.',
      ],
      [
        'What blocks the grey areas',
        'Each filter with the area it rules out: a commute, aircraft noise, a missing supermarket.',
      ],
      [
        'Your rules, not ours',
        'Nothing is pre-labelled as good or bad. You decide what matters and how far.',
      ],
    ],
    shotAlt:
      'Results panel of the demo: legend from well under budget to more than 15% over, eight ranked areas with size and rent, and bars showing how much area each filter blocks.',
    try: 'Open the demo',
  },
  cities: {
    title: 'Luxembourg today. Seven cities next.',
    lead: 'Tell us your city and we will write when it opens. The iOS app comes first to the cities with the most sign-ups.',
    demo: 'Demo live',
    soon: 'On the list',
    open: 'Open',
    app: 'iOS app',
    appText: 'Coming. Same map, in your pocket, with safety and the new cities.',
  },
  data: {
    title: 'Real data, with the source in sight.',
    lead: 'Timetables, rents and noise maps come from official publications; places from open maps. Every layer names where it comes from.',
    sources: [
      ['Public transport', 'Administration des transports publics', 'CC BY'],
      ['Rents', "Observatoire de l'Habitat", 'CC0'],
      ['Noise', "Administration de l'environnement (roads and rail 2021, airport 2023)", 'CC0'],
      ['Districts', 'Ville de Luxembourg', 'CC BY'],
      ['Base map and terrain', 'ACT Luxembourg', 'CC0'],
      [
        'Places',
        'OpenStreetMap contributors; Overture Maps Foundation',
        'ODbL; CDLA-Permissive-2.0',
      ],
      ['Childcare', "Ministère de l'Éducation nationale", 'CC0'],
    ],
    note: 'Sources for the Luxembourg demo. Each new city publishes its own list.',
  },
  form: {
    title: 'Get it for your city.',
    lead: 'One email when your city or the iOS app opens. No newsletter.',
    email: 'Email',
    emailHint: 'you@example.com',
    city: 'City',
    cityPlaceholder: 'Choose a city',
    locale: 'Write to me in',
    consent: 'I agree to receive emails about the launch. I can unsubscribe at any time.',
    privacy: 'Privacy policy',
    submit: 'Join the waitlist',
    sending: 'Joining…',
    success: 'You’re on the list. We’ll write when your city opens.',
    errors: {
      email: 'Enter a valid email address.',
      city: 'Choose a city.',
      locale: 'Choose a language.',
      consent: 'Tick the box so we can email you.',
      captcha: 'We couldn’t confirm you’re human. Wait for the check to finish and try again.',
      server: 'Something went wrong on our side. Try again in a minute.',
      network: 'No connection. Check your network and try again.',
    },
  },
  footer: {
    tagline: 'Where to look for a home, for your life.',
    privacy: 'Privacy',
    demo: 'Luxembourg demo',
    credits: 'Map data © OpenStreetMap contributors, ACT Luxembourg.',
    name: 'Working name; the final name is on its way.',
  },
};

export type Dict = typeof en;
