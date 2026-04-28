import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Trash2, Edit2 } from 'lucide-react';

/**
 * Generic sortable list with drag-and-drop.
 * Props:
 *   items: [{id, name, ...}]
 *   onReorder: (newItems) => void   — called after drop with reordered items
 *   onEdit: (item) => void
 *   onDelete: (item) => void
 *   renderBadge?: (item) => ReactNode  — optional extra badge per row
 *   lockLast?: boolean  — if true, last item cannot be moved above others ("אחר" always last)
 */
export default function SortableList({ items, onReorder, onEdit, onDelete, renderBadge, lockLast = false }) {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    let from = result.source.index;
    let to = result.destination.index;
    if (lockLast) {
      const lastIdx = items.length - 1;
      // Prevent moving last item up, or moving other items below last
      if (from === lastIdx) return;
      if (to >= lastIdx) to = lastIdx - 1;
    }
    if (from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder(next);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="list">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="border border-border bg-card rounded-xl overflow-hidden">
            {items.map((item, index) => {
              const isLocked = lockLast && index === items.length - 1;
              return (
                <Draggable key={item.id} draggableId={item.id} index={index} isDragDisabled={isLocked}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`flex items-center justify-between px-3 py-2.5 border-b last:border-b-0 transition-colors ${snapshot.isDragging ? 'bg-muted shadow-md' : 'hover:bg-muted/30'}`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div {...provided.dragHandleProps} className={`text-muted-foreground/40 ${isLocked ? 'opacity-20 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:text-muted-foreground'}`}>
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <span className="text-sm truncate">{item.name}</span>
                        {renderBadge?.(item)}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => onEdit(item)} className="p-1.5 hover:bg-muted rounded-lg"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                        <button onClick={() => onDelete(item)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                      </div>
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}