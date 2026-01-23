import { useRef, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import clsx from 'clsx';
import type { Tab, Section, ContentItem } from '../../../shared/types';

type DraggableItem = Tab | Section | ContentItem;

interface DragItem {
  type: 'tab' | 'section' | 'item';
  id: string;
  parentId?: string;
  index: number;
  item: DraggableItem;
}

interface DraggableTreeItemProps {
  item: DraggableItem;
  itemType: 'tab' | 'section' | 'item';
  index: number;
  parentId?: string;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  onDragStart?: (text: string) => void;
  onDragEnd?: () => void;
  children: React.ReactNode;
  className?: string;
}

export default function DraggableTreeItem({
  item,
  itemType,
  index,
  parentId,
  onMove,
  onDragStart,
  onDragEnd,
  children,
  className = ''
}: DraggableTreeItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, preview] = useDrag({
    type: itemType,
    item: () => {
      const dragText = `Dragging ${itemType}: ${item.title}`;
      onDragStart?.(dragText);
      return {
        type: itemType,
        id: item.id,
        parentId,
        index,
        item
      } as DragItem;
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: () => {
      onDragEnd?.();
    }
  });

  const [{ handlerId, isOver, canDrop }, drop] = useDrop<DragItem, void, {
    handlerId: any;
    isOver: boolean;
    canDrop: boolean;
  }>({
    accept: itemType,
    collect: (monitor) => ({
      handlerId: monitor.getHandlerId(),
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
    hover(draggedItem: DragItem, monitor) {
      if (!ref.current) {
        return;
      }

      const dragIndex = draggedItem.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Don't allow dropping items from different parents in the same container
      if (draggedItem.parentId !== parentId) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      onMove(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      draggedItem.index = hoverIndex;
    },
  });

  // Use empty image as drag preview to hide the default browser preview
  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  // Connect drag and drop refs
  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={clsx(
        'sortable-item',
        className,
        {
          'dragging': isDragging,
          'drag-over': isOver && canDrop,
          'drag-starting': isDragging
        }
      )}
      data-handler-id={handlerId}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      {children}
    </div>
  );
}