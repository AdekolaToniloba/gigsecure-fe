import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  id?: string;
  name?: string;
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  hasError?: boolean;
}

export default function Select({
  id,
  name,
  options,
  value,
  onChange,
  onBlur,
  placeholder = 'Select an option',
  disabled = false,
  className,
  hasError,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
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

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className="relative w-full text-left" id={id}>
      <button
        type="button"
        disabled={disabled}
        name={name}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onBlur={onBlur} // Trigger rhf blur when focus leaves the button naturally
        className={twMerge(
          'w-full h-[52px] rounded-lg border flex items-center justify-between px-4 transition-colors font-body text-[15px]',
          disabled ? 'opacity-60 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-500' : 'bg-[#F8FAFC] cursor-pointer text-gray-900',
          hasError
            ? 'border-red-500 focus:ring-1 focus:ring-red-500'
            : 'border-gray-200 hover:border-gray-300 focus:border-[#004E4C] focus:ring-1 focus:ring-[#004E4C] focus:outline-none',
          className
        )}
      >
        <span className={clsx(!selectedOption && 'text-gray-400')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={18} 
          className={clsx("text-gray-400 transition-transform duration-200", isOpen && "rotate-180")} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white py-1 shadow-lg max-h-60 overflow-y-auto"
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    if (onBlur) onBlur();
                  }}
                  className={twMerge(
                    'w-full text-left px-4 py-2.5 font-body text-[15px] transition-colors',
                    isSelected ? 'bg-[#004E4C]/10 text-[#004E4C] font-semibold' : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
