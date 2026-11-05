import { describe, expect, it } from 'vitest';

import { equipmentTypes, muscleGroups, muscleRegionOrder, trackingTypes } from '../exercises';
import { personalRecordTypes, progressMetricsByTrackingType } from '../progress';
import { validationErrorKeys } from '../schemas';
import { contentVisibilities, reportReasons } from '../social';
import { es } from './locales/es';

describe('Spanish copy', () => {
  it('has a message for every validation error key', () => {
    for (const key of validationErrorKeys) {
      expect(es.validation[key]).toBeTypeOf('string');
    }
  });

  it('names every muscle, piece of equipment and tracking type in the database', () => {
    for (const muscle of muscleGroups) {
      expect(es.muscles[muscle]).toBeTypeOf('string');
    }
    for (const equipment of equipmentTypes) {
      expect(es.equipment[equipment]).toBeTypeOf('string');
    }
    for (const trackingType of trackingTypes) {
      expect(es.trackingTypes[trackingType]).toBeTypeOf('string');
    }
    for (const region of muscleRegionOrder) {
      expect(es.muscleRegions[region]).toBeTypeOf('string');
    }
  });

  it('names every report reason and visibility', () => {
    for (const reason of reportReasons) {
      expect(es.report.reasons[reason]).toBeTypeOf('string');
    }
    for (const visibility of contentVisibilities) {
      expect(es.visibility.options[visibility]).toBeTypeOf('string');
    }
  });

  it('names every kind of record and every progress metric', () => {
    for (const type of personalRecordTypes) {
      expect(es.records.types[type]).toBeTypeOf('string');
    }
    for (const metric of Object.values(progressMetricsByTrackingType).flat()) {
      expect(es.exerciseProgress.metrics[metric]).toBeTypeOf('string');
    }
  });
});
