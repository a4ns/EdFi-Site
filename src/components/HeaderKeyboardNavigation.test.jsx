import { useCallback, useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Header from './Header';
import { AccountMenu, NotificationsMenu } from './dashboard/HeaderMenus';
import Modal from './dashboard/Modal';
import LocaleProvider from '../state/LocaleProvider';
import { AuthContext } from '../state/auth';
import { MarketsContext } from '../state/markets';
import { translate } from '../i18n/messages';

const MARKET = {
  list: [
    { symbol: 'BTC', name: 'Bitcoin', price: 84016, change: -0.5, volume: 1500 },
    { symbol: 'EDC', name: 'EdFi Coin', price: 0.0267, change: 1, volume: 5 },
  ],
  quotes: {}, live: false,
};

function CurrentPath() {
  return <output aria-label="Current path">{useLocation().pathname}</output>;
}

function AccountDialog() {
  const [open, setOpen] = useState(false);
  const onClose = useCallback(() => setOpen(false), []);
  return (
    <>
      <AccountMenu onAccount={() => setOpen(true)} />
      {open && <Modal title="Account" onClose={onClose}><p>Demo account</p></Modal>}
    </>
  );
}

function renderNavigation(children = <Header />) {
  return render(
    <MemoryRouter>
      <LocaleProvider>
        <AuthContext.Provider value={{ openAuth: vi.fn() }}>
          <MarketsContext.Provider value={MARKET}>
            {children}
            <button type="button">Outside control</button>
            <p>Outside text</p>
            <CurrentPath />
          </MarketsContext.Provider>
        </AuthContext.Provider>
      </LocaleProvider>
    </MemoryRouter>,
  );
}

function controlledPanel(trigger) {
  return document.getElementById(trigger.getAttribute('aria-controls'));
}

beforeEach(() => localStorage.clear());

describe('header keyboard disclosures', () => {
  it.each(['en', 'ru', 'kk'])('supports Enter, Space, Tab and Escape without reopening in %s', async (locale) => {
    localStorage.setItem('edfi.locale', locale);
    const user = userEvent.setup();
    renderNavigation();
    const trigger = screen.getByRole('button', { name: translate(locale, 'Learn & Earn') });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).not.toHaveAttribute('aria-haspopup');
    expect(controlledPanel(trigger)).not.toBeVisible();
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const links = within(controlledPanel(trigger)).getAllByRole('link');
    await user.tab();
    expect(links[0]).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
    expect(controlledPanel(trigger)).not.toBeVisible();
    await user.keyboard(' ');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    for (const link of links) {
      await user.tab();
      expect(link).toHaveFocus();
    }
    await user.tab();
    expect(screen.getByRole('link', { name: translate(locale, 'Markets'), exact: true })).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(localStorage.getItem('edfi.locale')).toBe(locale);
  });

  it('preserves hover opening and supports clicking and dismissing the same trigger repeatedly', async () => {
    const user = userEvent.setup();
    renderNavigation();
    const trigger = screen.getByRole('button', { name: 'More' });
    await user.hover(trigger);
    expect(controlledPanel(trigger)).toBeVisible();
    await user.unhover(trigger);
    expect(controlledPanel(trigger)).not.toBeVisible();
    await user.click(trigger);
    expect(controlledPanel(trigger)).toBeVisible();
    await user.click(trigger);
    expect(controlledPanel(trigger)).not.toBeVisible();
    await user.click(trigger);
    await user.tab();
    await user.click(screen.getByText('Outside text'));
    expect(controlledPanel(trigger)).not.toBeVisible();
    expect(trigger).toHaveFocus();
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Outside control' }));
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: 'Outside control' })).toHaveFocus();
  });

  it('returns search focus on Escape and outside dismissal, and leaves focus alone when tabbing out', async () => {
    const user = userEvent.setup();
    renderNavigation();
    const trigger = screen.getByRole('button', { name: 'Search' });
    await user.click(trigger);
    const input = screen.getByRole('textbox', { name: 'Search coins or pages' });
    expect(input).toHaveFocus();
    await user.type(input, 'BTC');
    await user.tab();
    expect(screen.getByRole('button', { name: 'Clear search' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(input).toHaveFocus();
    expect(input).toHaveValue('');
    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.keyboard('{Enter}');
    await user.click(screen.getByText('Outside text'));
    expect(trigger).toHaveFocus();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    await user.keyboard('{Enter}');
    await user.tab({ shift: true });
    expect(trigger).toHaveFocus();
    await user.tab({ shift: true });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).not.toHaveFocus();
  });

  it('dismisses an earlier panel when another opens so Escape restores only the current trigger', async () => {
    const user = userEvent.setup();
    renderNavigation();
    const search = screen.getByRole('button', { name: 'Search' });
    const navigation = screen.getByRole('button', { name: 'More' });
    await user.click(search);
    await user.hover(navigation);
    expect(search).toHaveAttribute('aria-expanded', 'false');
    expect(navigation).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(navigation).toHaveFocus();
    expect(navigation).toHaveAttribute('aria-expanded', 'false');
  });

  it.each(['BTC', 'EDC'])('opens the selected %s coin route from search', async (symbol) => {
    const user = userEvent.setup();
    renderNavigation();
    const trigger = screen.getByRole('button', { name: 'Search' });
    await user.click(trigger);
    await user.type(screen.getByRole('textbox', { name: 'Search coins or pages' }), symbol);
    const result = screen.getByRole('button', { name: new RegExp(`^${symbol}`) });
    expect(result).toHaveTextContent(symbol === 'EDC' ? 'Demo' : '/USDT');
    if (symbol === 'EDC') expect(result).not.toHaveTextContent('/USDT');
    await user.tab(); // Clear search.
    await user.tab();
    expect(result).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByLabelText('Current path')).toHaveTextContent(`/markets/${symbol}`);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the web demo disclosure by keyboard and dismisses it without trapping focus', async () => {
    const user = userEvent.setup();
    renderNavigation();
    const trigger = screen.getByRole('button', { name: 'Open web demo' });
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(controlledPanel(trigger)).toBeVisible();
    await user.tab();
    expect(within(controlledPanel(trigger)).getByRole('link', { name: 'Open web demo' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
    expect(controlledPanel(trigger)).not.toBeVisible();
    await user.keyboard(' ');
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByLabelText('Current path')).toHaveTextContent('/demo');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('cleans up dismissal handlers when an open header unmounts', async () => {
    const user = userEvent.setup();
    const view = renderNavigation();
    const trigger = screen.getByRole('button', { name: 'Search' });
    await user.click(trigger);
    const focus = vi.spyOn(trigger, 'focus');
    view.unmount();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(focus).not.toHaveBeenCalled();
  });
});

describe('dashboard header disclosures', () => {
  it('returns focus from notifications and preserves the read state after reopening', async () => {
    const user = userEvent.setup();
    renderNavigation(<NotificationsMenu />);
    const trigger = screen.getByRole('button', { name: 'Notifications, 3 unread' });
    trigger.focus();
    await user.keyboard('{Enter}');
    await user.tab();
    expect(screen.getByRole('button', { name: 'Mark all as read' })).toHaveFocus();
    await user.keyboard('{Enter}{Escape}');
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Mark all as read' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Outside control' }));
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: 'Outside control' })).toHaveFocus();
  });

  it('restores the account trigger after a menu action opens and closes a dialog', async () => {
    const user = userEvent.setup();
    renderNavigation(<AccountDialog />);
    const trigger = screen.getByRole('button', { name: 'Account menu' });
    await user.click(trigger);
    await user.tab(); // Copy UID.
    await user.tab();
    expect(screen.getByRole('button', { name: 'Account', exact: true })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('dialog', { name: 'Account' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('restores the account trigger on Escape and after copying the demo UID', async () => {
    const user = userEvent.setup();
    const onCopyUid = vi.fn();
    renderNavigation(<AccountMenu onCopyUid={onCopyUid} />);
    const trigger = screen.getByRole('button', { name: 'Account menu' });
    await user.click(trigger);
    await user.tab();
    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.tab();
    await user.keyboard('{Enter}');
    expect(onCopyUid).toHaveBeenCalledOnce();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});
