import {
  isValidPlaceContent,
  isValidPlaceItems,
  isValidPlaceSelf,
  isValidTouchAction,
} from '../../src/util/place';

describe('place validation', () => {
  describe('isValidPlaceContent', () => {
    it('should return true for valid values', () => {
      expect(isValidPlaceContent('center')).toBe(true);
      expect(isValidPlaceContent('start end')).toBe(true);
      expect(isValidPlaceContent('space-between')).toBe(true);
      expect(isValidPlaceContent('var(--foo)')).toBe(true);
      expect(isValidPlaceContent('baseline space-around')).toBe(true);
      expect(isValidPlaceContent('safe center')).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(isValidPlaceContent(' center')).toBe(false);
      expect(isValidPlaceContent('foo')).toBe(false);
      expect(isValidPlaceContent('center start end')).toBe(false);
    });
  });

  describe('isValidPlaceItems', () => {
    it('should return true for valid values', () => {
      expect(isValidPlaceItems('center')).toBe(true);
      expect(isValidPlaceItems('start end')).toBe(true);
      expect(isValidPlaceItems('stretch')).toBe(true);
      expect(isValidPlaceItems('var(--foo)')).toBe(true);
      expect(isValidPlaceItems('baseline center')).toBe(true);
      expect(isValidPlaceItems('safe start')).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(isValidPlaceItems(' center')).toBe(false);
      expect(isValidPlaceItems('foo')).toBe(false);
      expect(isValidPlaceItems('center start end')).toBe(false);
      expect(isValidPlaceItems('legacy')).toBe(false);
      expect(isValidPlaceItems('legacy center')).toBe(false);
    });
  });

  describe('isValidPlaceSelf', () => {
    it('should return true for valid values', () => {
      expect(isValidPlaceSelf('auto')).toBe(true);
      expect(isValidPlaceSelf('center')).toBe(true);
      expect(isValidPlaceSelf('start end')).toBe(true);
      expect(isValidPlaceSelf('stretch')).toBe(true);
      expect(isValidPlaceSelf('var(--foo)')).toBe(true);
      expect(isValidPlaceSelf('baseline center')).toBe(true);
      expect(isValidPlaceSelf('safe start')).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(isValidPlaceSelf(' auto')).toBe(false);
      expect(isValidPlaceSelf('foo')).toBe(false);
      expect(isValidPlaceSelf('center start end')).toBe(false);
    });
  });

  describe('isValidTouchAction', () => {
    it('should return true for valid values', () => {
      expect(isValidTouchAction('auto')).toBe(true);
      expect(isValidTouchAction('none')).toBe(true);
      expect(isValidTouchAction('pan-x')).toBe(true);
      expect(isValidTouchAction('pan-y pinch-zoom')).toBe(true);
      expect(isValidTouchAction('manipulation')).toBe(true);
      expect(isValidTouchAction('var(--foo)')).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(isValidTouchAction(' auto')).toBe(false);
      expect(isValidTouchAction('foo')).toBe(false);
      expect(isValidTouchAction('pan-x pan-y auto')).toBe(false);
      expect(isValidTouchAction('pan-y pan-up')).toBe(false);
      expect(isValidTouchAction('pan-x pan-left')).toBe(false);
    });
  });
});
