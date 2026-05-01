import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { SelectOption } from './Select';

interface ComboboxSelectProps {
  id?: string;
  name?: string;
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  hasError?: boolean;
}

export default function ComboboxSelect({
  id,
  name,
  options,
  value,
  onChange,
  onBlur,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  disabled = false,
  className,
  hasError = false,
}: ComboboxSelectProps) {
  const generatedId = useId();
  const inputId = id || `combobox-${generatedId}`;
  const listboxId = `${inputId}-listbox`;

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return options;

    return options.filter((opt) => opt.label.toLowerCase().includes(normalizedQuery));
  }, [options, query]);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  useEffect(() => {
    if (!isOpen) return;

    const selectedIdx = filteredOptions.findIndex((opt) => opt.value === value);
    setHighlightedIndex(selectedIdx >= 0 ? selectedIdx : filteredOptions.length > 0 ? 0 : -1);
  }, [filteredOptions, isOpen, value]);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery('');
        onBlur?.();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onBlur]);

  useEffect(() => {
    if (!isOpen) return;
    searchInputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || highlightedIndex < 0) return;
    const highlightedOption = optionRefs.current[highlightedIndex];
    if (highlightedOption && typeof highlightedOption.scrollIntoView === 'function') {
      highlightedOption.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, isOpen]);

  const closeMenu = () => {
    setIsOpen(false);
    setQuery('');
    onBlur?.();
  };

  const selectOption = (nextValue: string) => {
    onChange(nextValue);
    closeMenu();
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (event.key === 'Enter' && highlightedIndex >= 0) {
      event.preventDefault();
      const option = filteredOptions[highlightedIndex];
      if (option) selectOption(option.value);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full text-left">
      <button
        id={inputId}
        type="button"
        name={name}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        aria-invalid={hasError || undefined}
        aria-activedescendant={
          isOpen && highlightedIndex >= 0 ? `${inputId}-option-${highlightedIndex}` : undefined
        }
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        onBlur={() => {
          if (!isOpen) onBlur?.();
        }}
        className={twMerge(
          'w-full h-[52px] rounded-lg border flex items-center justify-between px-4 transition-colors font-body text-[15px]',
          disabled
            ? 'opacity-60 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-500'
            : 'bg-[#F8FAFC] cursor-pointer text-gray-900',
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
          className={clsx('text-gray-400 transition-transform duration-200', isOpen && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white py-2 shadow-lg"
          >
            <div className="px-3 pb-2">
              <label htmlFor={`${inputId}-search`} className="sr-only">
                Search options
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  id={`${inputId}-search`}
                  ref={searchInputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={handleMenuKeyDown}
                  placeholder={searchPlaceholder}
                  className="w-full h-10 rounded-md border border-gray-200 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-[#004E4C] focus:ring-1 focus:ring-[#004E4C]"
                />
              </div>
            </div>

            <div id={listboxId} role="listbox" className="max-h-60 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <p className="px-4 py-2 text-sm text-gray-500 font-body">No results found.</p>
              ) : (
                filteredOptions.map((option, index) => {
                  const isSelected = option.value === value;
                  const isHighlighted = index === highlightedIndex;

                  return (
                    <button
                      key={option.value}
                      id={`${inputId}-option-${index}`}
                      ref={(element) => {
                        optionRefs.current[index] = element;
                      }}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onClick={() => selectOption(option.value)}
                      className={twMerge(
                        'w-full text-left px-4 py-2.5 font-body text-[15px] transition-colors',
                        isSelected
                          ? 'bg-[#004E4C]/10 text-[#004E4C] font-semibold'
                          : isHighlighted
                            ? 'bg-gray-50 text-gray-900'
                            : 'text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
