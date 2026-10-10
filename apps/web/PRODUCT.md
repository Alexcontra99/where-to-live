# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro (static) + TypeScript, deployed on Cloudflare Pages with Pages Functions, D1 and Turnstile. No heavy UI framework.

## Users

Newcomers to a city (relocating expats, intra-EU movers, international students) who must choose where to rent from a distance, without knowing the neighbourhoods, usually before signing a 12-month lease. Secondary: people moving within or out of a city.

## Product Purpose

Tell people where in a city to look for a home, given their own constraints: commute times for each person (public transport on official timetables, bike, walking), rent per neighbourhood, noise (planes, trains, main roads), neighbourhood safety, and the places they want near or far (schools, supermarkets, parks, nightlife, their own places). This surface's job: explain the offer, let people try the Luxembourg demo, and collect a waitlist for the iOS app and new cities.

## Positioning

Portals answer "which flat"; this answers "which street, for my life". It combines door-to-door commutes on real timetables, rent, noise and user-chosen near/far places in one map of zones (green, amber, red) with the reason for each.

## Capabilities and Constraints

- Live today: Luxembourg web prototype (`prototipo/`, served at /demo). Commutes, rent heatmap, noise, near/far categories. No safety layer yet.
- Coming: iOS app; cities on the list: Madrid, Barcelona, Paris, London, Berlin, Rome, Milan.
- Commercial name undecided: "Where to Live" is a placeholder held in one constant.
- English first; Spanish, French, German, Italian later.

## Brand Commitments

- Neighbourhood labels (e.g. safety) are allowed only with official data or verified reviews and a visible source. Never label groups of people; no filters by religion, origin or social services.
- Only real, recognised places; never guesses.
- Marketing surfaces follow modern product-landing convention and match the app's own look (user, 2026-10-10). Reference: Scotch POS landing (landingfolio.com/inspiration/post/scotch).

## Evidence on Hand

- The working Luxembourg demo and its sources (`docs/notas/fuentes_datos.md`).
- No users, testimonials, press, prices or metrics yet: do not invent any.

## Product Principles

- Real, verifiable data with the source in sight.
- The user decides what matters and how far; the app does not impose taste.
- Show the reason behind every zone.
- Prototype first: the smallest thing a person can try.
