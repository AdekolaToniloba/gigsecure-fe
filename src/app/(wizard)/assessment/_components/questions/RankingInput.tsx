'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Controller, type Control } from 'react-hook-form';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, X } from 'lucide-react';
import type { RankingQuestion } from '@/types/risk-assessment';

interface Props {
  question: RankingQuestion;
  control: Control<Record<string, unknown>>;
  error?: string;
}

function SortableItem({ id, onRemove }: { id: string; onRemove: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.12)' : undefined,
    rotate: isDragging ? '1deg' : undefined,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 bg-[#004E4C] text-white rounded-lg px-3 py-2.5 border border-[#004E4C]/20"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="cursor-grab active:cursor-grabbing text-white/50 hover:text-white flex-shrink-0"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex-1 font-body text-[13px] text-white">{id}</span>
      <button
        type="button"
        onClick={() => onRemove(id)}
        aria-label={`Remove ${id}`}
        className="text-white/50 hover:text-white flex-shrink-0"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function RankingInput({ question, control, error }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <Controller
      name={question.id}
      control={control}
      defaultValue={[]}
      render={({ field }) => {
        const ranked: string[] = Array.isArray(field.value) ? (field.value as string[]) : [];
        const available = question.options.filter((o) => !ranked.includes(o));
        const isMaxed = ranked.length >= question.max_selections;

        const addToRanking = (option: string) => {
          if (!isMaxed) {
            field.onChange([...ranked, option]);
          }
        };

        const removeFromRanking = (option: string) => {
          field.onChange(ranked.filter((r) => r !== option));
        };

        const handleDragEnd = (event: DragEndEvent) => {
          const { active, over } = event;
          if (over && active.id !== over.id) {
            const oldIndex = ranked.indexOf(String(active.id));
            const newIndex = ranked.indexOf(String(over.id));
            field.onChange(arrayMove(ranked, oldIndex, newIndex));
          }
        };

        return (
          <div
            aria-describedby={error ? `${question.id}-error` : undefined}
          >
            <div className="grid grid-cols-2 gap-4">
              {/* Available options */}
              <div>
                <p className="text-xs font-semibold text-gray-500 font-body uppercase tracking-wide mb-2">
                  Available Options
                </p>
                <div className="flex flex-col gap-2 min-h-[80px]">
                  {available.map((option) => (
                    <motion.button
                      key={option}
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => addToRanking(option)}
                      disabled={isMaxed}
                      aria-label={`Add ${option} to ranking`}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-all duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#004E4C] ${
                        isMaxed
                          ? 'opacity-40 cursor-not-allowed border-gray-200 bg-gray-50'
                          : 'border-gray-200 bg-white hover:border-[#004E4C]/40'
                      }`}
                    >
                      <Plus className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <span className="font-body text-[13px] text-[#334155]">{option}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Ranking zone */}
              <div>
                <p className="text-xs font-semibold text-gray-500 font-body uppercase tracking-wide mb-2">
                  Your Ranking (top {question.max_selections})
                </p>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={ranked} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-2 min-h-[80px]">
                      {ranked.map((item) => (
                        <SortableItem key={item} id={item} onRemove={removeFromRanking} />
                      ))}
                      {ranked.length === 0 && (
                        <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 flex items-center justify-center">
                          <p className="text-xs text-gray-400 font-body text-center">
                            Click options to add
                          </p>
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </div>

            {error && (
              <p id={`${question.id}-error`} role="alert" className="mt-2 text-xs text-red-500 font-body">
                {error}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}
