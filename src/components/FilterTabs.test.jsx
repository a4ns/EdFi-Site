import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import FilterTabs from './FilterTabs';
import AuthModal from './AuthModal';

function Filters() {
  const [value, setValue] = useState('all');
  const tabs = [{ id: 'all', label: 'All' }, { id: 'gainers', label: 'Gainers' }, { id: 'losers', label: 'Losers' }];
  return <>
    <FilterTabs label="Market filters" tabs={tabs} value={value} onChange={setValue} panelId="results" />
    <div id="results" role="tabpanel" aria-labelledby={`results-tab-${value}`} tabIndex={0}>{value}</div>
  </>;
}

it('has one tab stop, wraps arrow navigation and connects the selected tab to its panel', async () => {
  const user = userEvent.setup();
  render(<Filters />);
  await user.tab();
  expect(screen.getByRole('tab', { name: 'All' })).toHaveFocus();
  await user.keyboard('{ArrowLeft}');
  expect(screen.getByRole('tab', { name: 'Losers' })).toHaveFocus();
  expect(screen.getByRole('tabpanel', { name: 'Losers' })).toHaveTextContent('losers');
  await user.keyboard('{ArrowRight}{ArrowRight}');
  expect(screen.getByRole('tab', { name: 'Gainers' })).toHaveFocus();
  await user.keyboard('{End}');
  expect(screen.getByRole('tab', { name: 'Losers' })).toHaveFocus();
  await user.keyboard('{Home}');
  expect(screen.getByRole('tab', { name: 'All' })).toHaveFocus();
  const tabs = within(screen.getByRole('tablist')).getAllByRole('tab');
  expect(tabs.map((tab) => tab.tabIndex)).toEqual([0, -1, -1]);
  await user.tab();
  expect(screen.getByRole('tabpanel', { name: 'All' })).toHaveFocus();
});

it('supports ordinary clicks without trapping unrelated keys', async () => {
  const user = userEvent.setup();
  render(<Filters />);
  await user.click(screen.getByRole('tab', { name: 'Gainers' }));
  expect(screen.getByRole('tab', { name: 'Gainers' })).toHaveAttribute('aria-selected', 'true');
  await user.keyboard('x');
  expect(screen.getByRole('tabpanel', { name: 'Gainers' })).toHaveTextContent('gainers');
});

it('applies the same keyboard and panel model to demo sign-in methods without losing input', async () => {
  const user = userEvent.setup();
  render(<AuthModal mode="signup" prefill="sample-value" onClose={() => {}} onDone={() => {}} />);
  await user.click(screen.getByRole('tab', { name: 'Email' }));
  await user.keyboard('{ArrowRight}');
  expect(screen.getByRole('tab', { name: 'Student ID' })).toHaveFocus();
  expect(screen.getByRole('tabpanel', { name: 'Student ID' })).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Student ID' })).toHaveValue('sample-value');
  await user.keyboard('{End}');
  expect(screen.getByRole('tab', { name: 'Phone' })).toHaveFocus();
  await user.keyboard('{Home}');
  expect(screen.getByRole('tab', { name: 'Email' })).toHaveFocus();
  expect(screen.getAllByRole('tab').map((tab) => tab.tabIndex)).toEqual([0, -1, -1]);
});
