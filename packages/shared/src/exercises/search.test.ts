import { describe, expect, it } from 'vitest';

import { filterExercises, normalizeForSearch, type SearchableExercise } from './search';

const library: SearchableExercise[] = [
  {
    name: 'Press de banca con barra',
    keywords: ['press banca', 'bench press', 'Pecho', 'Barra'],
    primaryMuscle: 'chest',
    equipment: 'barbell',
  },
  {
    name: 'Curl de bíceps con mancuernas',
    keywords: ['curl alterno', 'Bíceps', 'Mancuernas'],
    primaryMuscle: 'biceps',
    equipment: 'dumbbell',
  },
  {
    name: 'Aperturas en máquina',
    keywords: ['pec deck', 'contractora', 'Pecho', 'Máquina'],
    primaryMuscle: 'chest',
    equipment: 'machine',
  },
  {
    name: 'Press militar con barra',
    keywords: ['overhead press', 'Hombros', 'Barra'],
    primaryMuscle: 'shoulders',
    equipment: 'barbell',
  },
];

const noFilters = { query: '', muscle: null, equipment: null };
const names = (exercises: SearchableExercise[]) => exercises.map((exercise) => exercise.name);

describe('normalizeForSearch', () => {
  it('lowercases, removes accents and extra spaces', () => {
    expect(normalizeForSearch('  Bíceps   MÁQUINA ')).toBe('biceps maquina');
    expect(normalizeForSearch('Extensión de cuádriceps')).toBe('extension de cuadriceps');
  });
});

describe('filterExercises', () => {
  it('returns everything alphabetically without query or filters', () => {
    expect(names(filterExercises(library, noFilters))).toEqual([
      'Aperturas en máquina',
      'Curl de bíceps con mancuernas',
      'Press de banca con barra',
      'Press militar con barra',
    ]);
  });

  it('finds exercises without typing accents', () => {
    expect(names(filterExercises(library, { ...noFilters, query: 'biceps' }))).toEqual([
      'Curl de bíceps con mancuernas',
    ]);
  });

  it('needs every word of the query, in any order', () => {
    expect(names(filterExercises(library, { ...noFilters, query: 'barra press' }))).toEqual([
      'Press de banca con barra',
      'Press militar con barra',
    ]);
  });

  it('searches aliases too', () => {
    expect(names(filterExercises(library, { ...noFilters, query: 'pec deck' }))).toEqual([
      'Aperturas en máquina',
    ]);
  });

  it('ranks names that start with the query first', () => {
    expect(names(filterExercises(library, { ...noFilters, query: 'pecho' }))).toEqual([
      'Aperturas en máquina',
      'Press de banca con barra',
    ]);
    expect(names(filterExercises(library, { ...noFilters, query: 'press' }))[0]).toBe(
      'Press de banca con barra',
    );
  });

  it('filters by primary muscle and equipment', () => {
    expect(names(filterExercises(library, { ...noFilters, muscle: 'chest' }))).toEqual([
      'Aperturas en máquina',
      'Press de banca con barra',
    ]);
    expect(
      names(filterExercises(library, { query: '', muscle: 'chest', equipment: 'barbell' })),
    ).toEqual(['Press de banca con barra']);
  });

  it('returns nothing when no exercise matches', () => {
    expect(filterExercises(library, { ...noFilters, query: 'sentadilla' })).toEqual([]);
  });
});
