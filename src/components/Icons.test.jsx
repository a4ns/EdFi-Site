import { readFileSync } from 'node:fs';
import { URL as NodeURL } from 'node:url';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import CoinIcon from './CoinIcon';
import * as NavIcons from './NavIcons';
import Sidebar from './dashboard/Sidebar';
import { SIDEBAR_ITEMS } from './dashboard/nav';
import { COINS } from '../data/content';
import LocaleProvider from '../state/LocaleProvider';

describe('coin identification', () => {
  it.each(Object.keys(COINS).filter((symbol) => symbol !== 'EDC'))('serves a local decorative vector for %s without repeating the asset name', (symbol) => {
    const { container } = render(<span><CoinIcon symbol={symbol} size={28} />{COINS[symbol].name}</span>);
    const icon = container.querySelector('img');
    expect(icon).toHaveAttribute('src', `/coins/${symbol.toLowerCase()}.svg`);
    expect(icon).toHaveAttribute('width', '28');
    expect(icon).toHaveAttribute('height', '28');
    expect(icon).toHaveAttribute('alt', '');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText(COINS[symbol].name)).toBeInTheDocument();

    const asset = readFileSync(new NodeURL(`../../public/coins/${symbol.toLowerCase()}.svg`, import.meta.url), 'utf8');
    const svg = new DOMParser().parseFromString(asset, 'image/svg+xml');
    expect(svg.querySelector('parsererror')).toBeNull();
    expect(svg.documentElement.localName).toBe('svg');
    expect(svg.querySelector('path')).not.toBeNull();
    expect(svg.querySelector('script, foreignObject, image, text, a')).toBeNull();
    for (const node of svg.querySelectorAll('*')) {
      for (const attribute of node.attributes) {
        expect(attribute.name).not.toMatch(/^on|href$/i);
        if (attribute.value.includes('url(')) expect(attribute.value).toMatch(/^url\(#[^)]+\)$/);
      }
    }
  });

  it('keeps the EDC mortarboard separate from imported marks', () => {
    const { container } = render(<CoinIcon symbol="EDC" size={32} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('span')).toHaveClass('bg-brand');
    expect(container.querySelector('span')).toHaveStyle({ width: '32px', height: '32px' });
    expect(container.querySelectorAll('svg path')).toHaveLength(3);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it.each([undefined, '', 'UNKNOWN', 'constructor', '__proto__'])('renders a neutral vector for unsupported symbol %s', (symbol) => {
    const { container } = render(<CoinIcon symbol={symbol} />);
    expect(container.querySelector('img, text')).toBeNull();
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('svg')).toHaveAttribute('focusable', 'false');
  });
});

describe('filled account navigation', () => {
  it('keeps every navigation icon decorative, scalable and theme-aware', () => {
    for (const Component of Object.values(NavIcons)) {
      const { container, unmount } = render(<Component size={24} className="text-yellow-text" />);
      const icon = container.querySelector('svg');
      expect(icon).toHaveAttribute('viewBox', '0 0 24 24');
      expect(icon).toHaveAttribute('width', '24');
      expect(icon).toHaveAttribute('height', '24');
      expect(icon).toHaveAttribute('fill', 'currentColor');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
      expect(icon).toHaveAttribute('focusable', 'false');
      expect(icon).toHaveClass('text-yellow-text');
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      unmount();
    }
  });

  it('preserves named navigation, the current page and every original action', async () => {
    localStorage.clear();
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<MemoryRouter><LocaleProvider><Sidebar active="earn" onSelect={onSelect} /></LocaleProvider></MemoryRouter>);
    const nav = screen.getByRole('navigation', { name: 'Account' });
    const buttons = within(nav).getAllByRole('button');
    expect(buttons).toHaveLength(SIDEBAR_ITEMS.length);
    expect(within(nav).getByRole('button', { name: 'Learn & Earn' })).toHaveAttribute('aria-current', 'page');
    expect(buttons.filter((button) => button.hasAttribute('aria-current'))).toHaveLength(1);
    for (const item of SIDEBAR_ITEMS) {
      await user.click(within(nav).getByRole('button', { name: item.label, exact: true }));
      expect(onSelect).toHaveBeenLastCalledWith(item);
    }
    expect(onSelect).toHaveBeenCalledTimes(SIDEBAR_ITEMS.length);
    expect(screen.getByRole('link', { name: 'Exit demo' })).toHaveAttribute('href', '/');
  });
});
