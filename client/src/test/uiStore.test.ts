import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../store/uiStore';

describe('UI Store', () => {
  let store: ReturnType<typeof useUIStore>;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Get a fresh store instance
    store = useUIStore.getState();
    store.clearState();
  });

  describe('Section Toggle', () => {
    it('should toggle section expansion for caregiver view', () => {
      const sectionId = 'test-section-1';

      // Initially should not be expanded
      expect(store.isExpanded('caregiver', sectionId)).toBe(false);

      // Toggle to expand
      store.toggleSection('caregiver', sectionId);
      expect(store.isExpanded('caregiver', sectionId)).toBe(true);

      // Toggle to collapse
      store.toggleSection('caregiver', sectionId);
      expect(store.isExpanded('caregiver', sectionId)).toBe(false);
    });

    it('should toggle section expansion for carerecipient view', () => {
      const sectionId = 'test-section-1';

      // Initially should not be expanded
      expect(store.isExpanded('carerecipient', sectionId)).toBe(false);

      // Toggle to expand
      store.toggleSection('carerecipient', sectionId);
      expect(store.isExpanded('carerecipient', sectionId)).toBe(true);
    });

    it('should maintain separate state for different view types', () => {
      const sectionId = 'test-section-1';

      // Expand in caregiver view
      store.toggleSection('caregiver', sectionId);
      expect(store.isExpanded('caregiver', sectionId)).toBe(true);
      expect(store.isExpanded('carerecipient', sectionId)).toBe(false);

      // Expand in carerecipient view
      store.toggleSection('carerecipient', sectionId);
      expect(store.isExpanded('carerecipient', sectionId)).toBe(true);
      expect(store.isExpanded('caregiver', sectionId)).toBe(true);
    });
  });

  describe('Item Toggle', () => {
    it('should toggle item expansion for caregiver view', () => {
      const itemId = 'test-item-1';

      // Initially should not be expanded
      expect(store.isItemExpanded('caregiver', itemId)).toBe(false);

      // Toggle to expand
      store.toggleItem('caregiver', itemId);
      expect(store.isItemExpanded('caregiver', itemId)).toBe(true);

      // Toggle to collapse
      store.toggleItem('caregiver', itemId);
      expect(store.isItemExpanded('caregiver', itemId)).toBe(false);
    });

    it('should maintain separate state for different view types', () => {
      const itemId = 'test-item-1';

      // Expand in caregiver view
      store.toggleItem('caregiver', itemId);
      expect(store.isItemExpanded('caregiver', itemId)).toBe(true);
      expect(store.isItemExpanded('carerecipient', itemId)).toBe(false);

      // Expand in carerecipient view
      store.toggleItem('carerecipient', itemId);
      expect(store.isItemExpanded('carerecipient', itemId)).toBe(true);
      expect(store.isItemExpanded('caregiver', itemId)).toBe(true);
    });
  });

  describe('Invalid View Type Handling', () => {
    it('should handle invalid view types gracefully', () => {
      const sectionId = 'test-section-1';
      const itemId = 'test-item-1';

      // Should not crash and return false for invalid view types
      expect(store.isExpanded('invalid', sectionId)).toBe(false);
      expect(store.isItemExpanded('invalid', itemId)).toBe(false);

      // Should not change state for invalid view types
      store.toggleSection('invalid', sectionId);
      store.toggleItem('invalid', itemId);

      expect(store.isExpanded('caregiver', sectionId)).toBe(false);
      expect(store.isItemExpanded('caregiver', itemId)).toBe(false);
    });
  });

  describe('Clear State', () => {
    it('should clear all expanded sections and items', () => {
      // Set some expanded state
      store.toggleSection('caregiver', 'section-1');
      store.toggleSection('carerecipient', 'section-2');
      store.toggleItem('caregiver', 'item-1');
      store.toggleItem('carerecipient', 'item-2');

      // Verify they are expanded
      expect(store.isExpanded('caregiver', 'section-1')).toBe(true);
      expect(store.isExpanded('carerecipient', 'section-2')).toBe(true);
      expect(store.isItemExpanded('caregiver', 'item-1')).toBe(true);
      expect(store.isItemExpanded('carerecipient', 'item-2')).toBe(true);

      // Clear state
      store.clearState();

      // Verify everything is cleared
      expect(store.isExpanded('caregiver', 'section-1')).toBe(false);
      expect(store.isExpanded('carerecipient', 'section-2')).toBe(false);
      expect(store.isItemExpanded('caregiver', 'item-1')).toBe(false);
      expect(store.isItemExpanded('carerecipient', 'item-2')).toBe(false);
    });
  });

  describe('Multiple Sections and Items', () => {
    it('should handle multiple expanded sections simultaneously', () => {
      const sections = ['section-1', 'section-2', 'section-3'];

      // Expand all sections
      sections.forEach(sectionId => {
        store.toggleSection('caregiver', sectionId);
      });

      // Verify all are expanded
      sections.forEach(sectionId => {
        expect(store.isExpanded('caregiver', sectionId)).toBe(true);
      });

      // Collapse one section
      store.toggleSection('caregiver', 'section-2');

      // Verify correct state
      expect(store.isExpanded('caregiver', 'section-1')).toBe(true);
      expect(store.isExpanded('caregiver', 'section-2')).toBe(false);
      expect(store.isExpanded('caregiver', 'section-3')).toBe(true);
    });
  });
});