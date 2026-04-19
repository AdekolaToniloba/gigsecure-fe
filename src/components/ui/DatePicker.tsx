import React, { useState, useRef, useEffect } from 'react';
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
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        if (onBlur) onBlur();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onBlur]);

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
    <div ref={containerRef} className="relative w-full text-left" id={id}>
      <button
        type="button"
        disabled={disabled}
        name={name}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onBlur={onBlur} 
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

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 mt-1 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl"
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
      </AnimatePresence>
    </div>
  );
}
