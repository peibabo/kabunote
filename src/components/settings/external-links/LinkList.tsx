'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { ExternalLink } from '@/lib/defaultExternalLinks';
import SortableLinkItem from './SortableLinkItem';

export interface LinkListProps {
  links: ExternalLink[];
  onDragEnd: (event: DragEndEvent) => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

export default function LinkList({ links, onDragEnd, onEdit, onDelete }: LinkListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  return (
    <div className="space-y-2 mb-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext
          items={links.map((l, i) => l.id || `link-${i}`)}
          strategy={verticalListSortingStrategy}
        >
          {links.map((link, index) => (
            <SortableLinkItem
              key={link.id || `link-${index}`}
              link={link}
              index={index}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>
      </DndContext>

      {links.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-4">リンクがありません</p>
      )}
    </div>
  );
}
