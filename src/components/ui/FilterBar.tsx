import type { ReactNode } from 'react';

import { useTranslation } from 'react-i18next';

import { RotateCcw, Search } from '@/icons';

import { Button } from './Button';

import { Input } from './Input';



interface FilterBarProps {

  searchValue?: string;

  searchPlaceholder?: string;

  onSearchChange?: (value: string) => void;

  onReset?: () => void;

  resetDisabled?: boolean;

  resetLabel?: string;

  ariaLabel?: string;

  children?: ReactNode;

  extraActions?: ReactNode;

  className?: string;

  searchIconSize?: number;

}



export function FilterBar({

  searchValue = '',

  searchPlaceholder,

  onSearchChange,

  onReset,

  resetDisabled = false,

  resetLabel,

  ariaLabel,

  children,

  extraActions,

  className = '',

  searchIconSize = 18,

}: FilterBarProps) {

  const { t } = useTranslation('common');



  return (

    <section className={`filter-bar ${className}`.trim()} aria-label={ariaLabel ?? t('filter.ariaLabel')}>

      <div className="filter-bar-fields">

        {onSearchChange ? (

          <Input

            label={t('filter.searchLabel')}

            value={searchValue}

            onChange={(e) => onSearchChange(e.target.value)}

            placeholder={searchPlaceholder ?? t('filter.searchPlaceholder')}

            icon={<Search size={searchIconSize} aria-hidden />}

            className="filter-bar-search"

          />

        ) : null}

        {children}

      </div>

      {extraActions || onReset ? (

        <div className="filter-bar-actions">

          {extraActions}

          {onReset ? (

            <Button

              type="button"

              variant="ghost"

              size="sm"

              className="filter-bar-reset"

              onClick={onReset}

              disabled={resetDisabled}

              icon={<RotateCcw size={16} aria-hidden />}

            >

              {resetLabel ?? t('filter.reset')}

            </Button>

          ) : null}

        </div>

      ) : null}

    </section>

  );

}

