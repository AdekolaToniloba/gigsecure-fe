import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format, parse } from 'date-fns';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import 'react-day-picker/dist/style.css';

interface DatePickerProps {
  id?: string;
  name?: string;
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  hasError?: boolean;
  ariaDescribedBy?: string;
}

export default function DatePicker({
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder = 'dd/mm/yyyy',
  disabled = false,
  className,
  hasError,
  ariaDescribedBy,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [portalStyle, setPortalStyle] = useState<React.CSSProperties | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const isInsideTrigger = containerRef.current?.contains(target);
      const isInsidePanel = panelRef.current?.contains(target);

      if (!isInsideTrigger && !isInsidePanel) {
        setIsOpen(false);
        if (onBlur) onBlur();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onBlur]);

  useEffect(() => {
    if (!isOpen) return;

    function updatePortalPosition() {
      const trigger = triggerRef.current;
      const panel = panelRef.current;
      if (!trigger || !panel) return;

      const triggerRect = trigger.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const panelHeight = panelRect.height || 360;
      const panelWidth = panelRect.width || 320;
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const gutter = 12;
      const spaceBelow = viewportHeight - triggerRect.bottom - gutter;
      const spaceAbove = triggerRect.top - gutter;
      const shouldOpenAbove = spaceBelow < panelHeight && spaceAbove > spaceBelow;

      const top = shouldOpenAbove
        ? Math.max(gutter, triggerRect.top - panelHeight - 8)
        : Math.min(viewportHeight - panelHeight - gutter, triggerRect.bottom + 8);
      const left = Math.min(
        Math.max(gutter, triggerRect.left),
        viewportWidth - panelWidth - gutter
      );

      setPortalStyle({
        position: 'fixed',
        top,
        left,
        zIndex: 9999,
      });
    }

    updatePortalPosition();
    window.addEventListener('resize', updatePortalPosition);
    window.addEventListener('scroll', updatePortalPosition, true);

    return () => {
      window.removeEventListener('resize', updatePortalPosition);
      window.removeEventListener('scroll', updatePortalPosition, true);
    };
  }, [isOpen]);

  let selectedDate: Date | undefined = undefined;
  if (value && value.length === 10) {
    const parsed = parse(value, 'dd/MM/yyyy', new Date());
    if (!isNaN(parsed.getTime())) {
      selectedDate = parsed;
    }
  }

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, 'dd/MM/yyyy'));
      setIsOpen(false);
      if (onBlur) onBlur();
    }
  };

  return (
    <div ref={containerRef} className="relative w-full text-left">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        name={name}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onBlur={onBlur} 
        aria-describedby={ariaDescribedBy}
        className={twMerge(
          'w-full h-[52px] rounded-lg border flex items-center justify-between px-4 transition-colors font-body text-[15px]',
          disabled ? 'opacity-60 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-500' : 'bg-[#F8FAFC] cursor-pointer text-gray-900',
          hasError
            ? 'border-red-500 focus:ring-1 focus:ring-red-500'
            : 'border-gray-200 hover:border-gray-300 focus:border-[#004E4C] focus:ring-1 focus:ring-[#004E4C] focus:outline-none',
          className
        )}
      >
        <span className={clsx(!value && 'text-gray-400')}>
          {value || placeholder}
        </span>
        <CalendarIcon size={18} className="text-gray-400" />
      </button>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={panelRef}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={portalStyle ?? undefined}
                className="z-[9999] w-max max-w-[calc(100vw-1.5rem)] rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl"
              >
                <style>{`
                  .rdp {
                    --rdp-cell-size: 40px;
                    --rdp-accent-color: #004E4C;
                    --rdp-background-color: #E6EEEE;
                    margin: 0;
                  }
                  .rdp-day_selected {
                    font-weight: bold;
                  }
                `}</style>
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleSelect}
                  defaultMonth={selectedDate || new Date(2000, 0)}
                  captionLayout="dropdown"
                  fromYear={1900}
                  toYear={new Date().getFullYear()}
                />
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
