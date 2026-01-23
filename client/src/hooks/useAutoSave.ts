import { useEffect, useState, useRef } from 'react';
import { useDebounce } from './useDebounce';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Hook that automatically saves content after a delay of no changes
 * @param saveFunction - Function to call when saving
 * @param content - The content to watch for changes
 * @param delay - Delay in milliseconds before auto-saving (default: 2000ms)
 * @returns Object with save status and manual save function
 */
export const useAutoSave = (
  saveFunction: () => Promise<void> | void,
  content: any,
  delay: number = 2000
) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [hasChanges, setHasChanges] = useState(false);
  const debouncedContent = useDebounce(content, delay);
  const initialContentRef = useRef(content);
  const isFirstRenderRef = useRef(true);

  // Track if content has changed from initial state
  useEffect(() => {
    if (isFirstRenderRef.current) {
      initialContentRef.current = content;
      isFirstRenderRef.current = false;
      return;
    }

    const contentChanged = JSON.stringify(content) !== JSON.stringify(initialContentRef.current);
    setHasChanges(contentChanged);

    if (contentChanged && saveStatus === 'saved') {
      setSaveStatus('idle');
    }
  }, [content, saveStatus]);

  // Auto-save when debounced content changes
  useEffect(() => {
    if (isFirstRenderRef.current) {
      return;
    }

    if (hasChanges) {
      handleSave();
    }
  }, [debouncedContent]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!hasChanges) return;

    try {
      setSaveStatus('saving');
      await saveFunction();
      setSaveStatus('saved');
      setHasChanges(false);
      initialContentRef.current = content;
      // Keep 'saved' status visible until next change
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSaveStatus('error');
      // Keep 'error' status visible until next change attempt
    }
  };

  const manualSave = async () => {
    await handleSave();
  };

  return {
    saveStatus,
    hasChanges,
    manualSave
  };
};