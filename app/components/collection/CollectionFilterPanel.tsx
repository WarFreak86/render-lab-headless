import type {FormEvent} from 'react';
import {Form, Link} from 'react-router';
import {Accordion} from '~/components/Accordion';
import {Button} from '~/components/Button';
import type {CollectionFilterGroup} from '~/lib/collection';
import {clearCollectionFilters} from '~/lib/collection';

function PreservedSort({searchParams}: {searchParams: URLSearchParams}) {
  const sort = searchParams.get('sort_by');
  return sort ? <input type="hidden" name="sort_by" value={sort} /> : null;
}

function ListFilter({
  group,
  idPrefix,
  searchParams,
}: {
  group: CollectionFilterGroup;
  idPrefix: string;
  searchParams: URLSearchParams;
}) {
  const selected = searchParams.getAll(group.id);
  return (
    <fieldset className="collection-filter-list">
      <legend className="sr-only">{group.label}</legend>
      {group.options.map((option) => {
        const checked = selected.includes(option.value);
        const id = `${idPrefix}-${option.id.replaceAll('.', '-')}`;
        return (
          <label className="collection-filter-option" htmlFor={id} key={option.id}>
            <input
              defaultChecked={checked}
              disabled={option.count === 0 && !checked}
              id={id}
              key={`${option.id}-${checked}`}
              name={group.id}
              type="checkbox"
              value={option.value}
            />
            <span>{option.label}</span>
            <span aria-label={`${option.count} matching products`}>
              {option.count}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

function PriceFilter({
  group,
  idPrefix,
  searchParams,
}: {
  group: CollectionFilterGroup;
  idPrefix: string;
  searchParams: URLSearchParams;
}) {
  if (!group.price) return null;
  const minName = 'filter.v.price.gte';
  const maxName = 'filter.v.price.lte';
  const min = searchParams.get(minName) ?? '';
  const max = searchParams.get(maxName) ?? '';
  const currency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: group.price.currencyCode,
    maximumFractionDigits: 0,
  });

  return (
    <fieldset className="collection-price-filter">
      <legend className="sr-only">{group.label}</legend>
      <div className="collection-price-filter__available">
        <span>{currency.format(group.price.min)}</span>
        <span>{currency.format(group.price.max)}</span>
      </div>
      <div className="collection-price-filter__inputs">
        <label htmlFor={`${idPrefix}-price-min`}>
          <span>Minimum</span>
          <input
            defaultValue={min}
            id={`${idPrefix}-price-min`}
            key={`min-${min}`}
            min={group.price.min}
            name={minName}
            placeholder={String(group.price.min)}
            step="1"
            type="number"
          />
        </label>
        <span aria-hidden="true">—</span>
        <label htmlFor={`${idPrefix}-price-max`}>
          <span>Maximum</span>
          <input
            defaultValue={max}
            id={`${idPrefix}-price-max`}
            key={`max-${max}`}
            min={group.price.min}
            name={maxName}
            placeholder={String(group.price.max)}
            step="1"
            type="number"
          />
        </label>
      </div>
    </fieldset>
  );
}

export function CollectionFilterPanel({
  groups,
  idPrefix,
  onApply,
  searchParams,
}: {
  groups: CollectionFilterGroup[];
  idPrefix: string;
  onApply?: () => void;
  searchParams: URLSearchParams;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const temporarilyDisabled: HTMLInputElement[] = [];
    for (const input of event.currentTarget.querySelectorAll<HTMLInputElement>(
      'input[type="number"]',
    )) {
      if (!input.value) {
        input.disabled = true;
        temporarilyDisabled.push(input);
      }
    }
    queueMicrotask(() => {
      for (const input of temporarilyDisabled) input.disabled = false;
    });
    onApply?.();
  }

  return (
    <Form className="collection-filter-form" method="get" onSubmit={handleSubmit}>
      <PreservedSort searchParams={searchParams} />
      <div className="collection-filter-form__groups">
        {groups.map((group, index) => (
          <Accordion defaultOpen={index < 2} key={group.id} title={group.label}>
            {group.type === 'list' ? (
              <ListFilter
                group={group}
                idPrefix={idPrefix}
                searchParams={searchParams}
              />
            ) : (
              <PriceFilter
                group={group}
                idPrefix={idPrefix}
                searchParams={searchParams}
              />
            )}
          </Accordion>
        ))}
      </div>
      <div className="collection-filter-form__actions">
        <Button type="submit">Apply filters</Button>
        <Link className="button button--text" to={clearCollectionFilters(searchParams)}>
          <span>Clear all</span>
        </Link>
      </div>
    </Form>
  );
}
