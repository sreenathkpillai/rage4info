import { useEffect, useCallback } from 'react';

/**
 * Hook to warn users about unsaved changes when they try to navigate away
 * @param hasChanges - Boolean indicating if there are unsaved changes
 * @returns confirmNavigation function for programmatic navigation checks
 */
export const useUnsavedChanges = (hasChanges: boolean) => {
  // Handle browser navigation (refresh, close tab, back/forward)
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasChanges) {
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return event.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasChanges]);

  // Function for programmatic navigation confirmation
  const confirmNavigation = useCallback((): boolean => {
    if (!hasChanges) {
      return true;
    }

    return window.confirm(
      'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.'
    );
  }, [hasChanges]);

  return { confirmNavigation };
};