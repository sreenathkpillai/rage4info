import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Storage interface for serializing Sets
interface UIStorageState {
  expandedSections: {
    caregiver: string[];
    carerecipient: string[];
  };
  expandedItems: {
    caregiver: string[];
    carerecipient: string[];
  };
}

interface UIState {
  // State for expanded sections and items per view type
  expandedSections: {
    caregiver: Set<string>;
    carerecipient: Set<string>;
  };
  expandedItems: {
    caregiver: Set<string>;
    carerecipient: Set<string>;
  };

  // Actions
  toggleSection: (type: string, sectionId: string) => void;
  toggleItem: (type: string, itemId: string) => void;
  isExpanded: (type: string, sectionId: string) => boolean;
  isItemExpanded: (type: string, itemId: string) => boolean;
  clearState: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      expandedSections: {
        caregiver: new Set<string>(),
        carerecipient: new Set<string>()
      },
      expandedItems: {
        caregiver: new Set<string>(),
        carerecipient: new Set<string>()
      },

      // Toggle section expansion state
      toggleSection: (type: string, sectionId: string) => {
        const viewType = type as 'caregiver' | 'carerecipient';
        if (!['caregiver', 'carerecipient'].includes(viewType)) {
          console.warn(`Invalid view type: ${type}`);
          return;
        }

        set((state) => {
          const newExpandedSections = { ...state.expandedSections };
          newExpandedSections[viewType] = new Set(newExpandedSections[viewType]);

          if (newExpandedSections[viewType].has(sectionId)) {
            newExpandedSections[viewType].delete(sectionId);
          } else {
            newExpandedSections[viewType].add(sectionId);
          }

          return { expandedSections: newExpandedSections };
        });
      },

      // Toggle item expansion state
      toggleItem: (type: string, itemId: string) => {
        const viewType = type as 'caregiver' | 'carerecipient';
        if (!['caregiver', 'carerecipient'].includes(viewType)) {
          console.warn(`Invalid view type: ${type}`);
          return;
        }

        set((state) => {
          const newExpandedItems = { ...state.expandedItems };
          newExpandedItems[viewType] = new Set(newExpandedItems[viewType]);

          if (newExpandedItems[viewType].has(itemId)) {
            newExpandedItems[viewType].delete(itemId);
          } else {
            newExpandedItems[viewType].add(itemId);
          }

          return { expandedItems: newExpandedItems };
        });
      },

      // Check if a section is expanded
      isExpanded: (type: string, sectionId: string) => {
        const viewType = type as 'caregiver' | 'carerecipient';
        if (!['caregiver', 'carerecipient'].includes(viewType)) {
          return false;
        }
        return get().expandedSections[viewType].has(sectionId);
      },

      // Check if an item is expanded
      isItemExpanded: (type: string, itemId: string) => {
        const viewType = type as 'caregiver' | 'carerecipient';
        if (!['caregiver', 'carerecipient'].includes(viewType)) {
          return false;
        }
        return get().expandedItems[viewType].has(itemId);
      },

      // Clear all state (useful for testing or reset)
      clearState: () => {
        set({
          expandedSections: {
            caregiver: new Set<string>(),
            carerecipient: new Set<string>()
          },
          expandedItems: {
            caregiver: new Set<string>(),
            carerecipient: new Set<string>()
          }
        });
      }
    }),
    {
      name: 'care-hub-ui-state',
      storage: {
        getItem: (name: string) => {
          const str = localStorage.getItem(name);
          if (!str) return null;

          try {
            const parsed: UIStorageState = JSON.parse(str);
            return {
              state: {
                expandedSections: {
                  caregiver: new Set(parsed.expandedSections?.caregiver || []),
                  carerecipient: new Set(parsed.expandedSections?.carerecipient || [])
                },
                expandedItems: {
                  caregiver: new Set(parsed.expandedItems?.caregiver || []),
                  carerecipient: new Set(parsed.expandedItems?.carerecipient || [])
                }
              },
              version: 0
            };
          } catch {
            return null;
          }
        },
        setItem: (name: string, value: any) => {
          const state = value.state as UIState;
          const storageValue: UIStorageState = {
            expandedSections: {
              caregiver: Array.from(state.expandedSections.caregiver),
              carerecipient: Array.from(state.expandedSections.carerecipient)
            },
            expandedItems: {
              caregiver: Array.from(state.expandedItems.caregiver),
              carerecipient: Array.from(state.expandedItems.carerecipient)
            }
          };
          localStorage.setItem(name, JSON.stringify(storageValue));
        },
        removeItem: (name: string) => {
          localStorage.removeItem(name);
        }
      },
      partialize: (state) => ({
        expandedSections: state.expandedSections,
        expandedItems: state.expandedItems
      })
    }
  )
);

// Export the type for use in components
export type { UIState };