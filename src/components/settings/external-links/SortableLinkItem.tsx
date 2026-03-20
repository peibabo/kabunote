'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ExternalLink } from '@/lib/defaultExternalLinks';

export interface SortableLinkItemProps {
  link: ExternalLink;
  index: number;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

export default function SortableLinkItem({ link, index, onEdit, onDelete }: SortableLinkItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id || `link-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 bg-gray-700 rounded-lg p-3"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-400 hover:text-gray-200 touch-none"
        title="ドラッグして並べ替え"
      >
        ⠿
      </button>
      <span className={`w-8 h-8 rounded-full bg-gradient-to-r ${link.gradient} flex items-center justify-center text-base flex-shrink-0`}>
        {link.icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white truncate">{link.label}</div>
        <div className="text-xs text-gray-400 truncate">{link.url}</div>
      </div>
      <button
        onClick={() => onEdit(index)}
        className="cursor-pointer text-gray-400 hover:text-blue-400 transition-colors p-1 text-sm flex-shrink-0"
        title="編集"
      >
        編集
      </button>
      <button
        onClick={() => onDelete(index)}
        className="cursor-pointer text-gray-400 hover:text-red-400 transition-colors p-1 text-sm flex-shrink-0"
        title="削除"
      >
        ✕
      </button>
    </div>
  );
}
