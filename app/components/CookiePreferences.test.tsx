import {fireEvent, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {CookiePreferences} from './CookiePreferences';

const state = vi.hoisted(() => ({
  banner: null as null | {showPreferences: () => void},
}));
vi.mock('@shopify/hydrogen', () => ({
  useAnalytics: () => ({privacyBanner: state.banner}),
}));

afterEach(() => {
  state.banner = null;
});

it('waits for Shopify and exposes keyboard-accessible choices when ready', async () => {
  const user = userEvent.setup();
  const {rerender} = render(<CookiePreferences />);
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  const showPreferences = vi.fn();
  state.banner = {showPreferences};
  rerender(<CookiePreferences />);
  const button = screen.getByRole('button', {name: 'Cookie preferences'});
  expect(button).toHaveAttribute('type', 'button');
  expect(showPreferences).not.toHaveBeenCalled();
  await user.tab();
  expect(button).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(showPreferences).toHaveBeenCalledExactlyOnceWith();
});

it('opens preferences repeatedly so an existing choice can be revised', () => {
  const showPreferences = vi.fn();
  state.banner = {showPreferences};
  render(<CookiePreferences />);
  const button = screen.getByRole('button', {name: 'Cookie preferences'});
  fireEvent.click(button);
  fireEvent.click(button);
  expect(showPreferences).toHaveBeenCalledTimes(2);
});
