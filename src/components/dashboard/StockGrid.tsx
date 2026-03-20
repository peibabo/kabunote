'use client';

import StockCard from '@/components/stock/StockCard';
import { FavoriteGroup } from '@/types/favorites';
import { StockData } from '@/hooks/stock/useStockData';
import {
  DndContext,
  closestCenter,
  type SensorDescriptor,
  type SensorOptions,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';

interface StockGridProps {
  filteredStocks: string[];
  sensors: SensorDescriptor<SensorOptions>[];
  onDragEnd: (event: DragEndEvent) => void;
  onRemoveStock: (code: string) => void;
  favoriteGroups: FavoriteGroup[];
  onFavoriteGroupsChange: (groups: FavoriteGroup[]) => void;
  stockDataMap: Map<string, StockData>;
}

export default function StockGrid({
  filteredStocks,
  sensors,
  onDragEnd,
  onRemoveStock,
  favoriteGroups,
  onFavoriteGroupsChange,
  stockDataMap,
}: StockGridProps) {
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={() => {}}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={filteredStocks} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20 md:pb-0" style={{gridAutoRows: '1fr'}}>
          {filteredStocks.map((stock) => (
            <div key={stock} id={`stock-card-${stock}`} className="h-full">
              <StockCard
                symbol={stock}
                onRemove={onRemoveStock}
                favoriteGroups={favoriteGroups}
                onFavoriteGroupsChange={onFavoriteGroupsChange}
                initialStockData={stockDataMap.get(stock)}
              />
            </div>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
