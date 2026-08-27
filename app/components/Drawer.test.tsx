import {useState} from 'react';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Drawer} from '~/components/Drawer';

function DrawerHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open drawer
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Navigation">
        <button type="button">First action</button>
        <button type="button">Last action</button>
      </Drawer>
    </>
  );
}

describe('Drawer', () => {
  it('opens, traps focus, closes with Escape, and restores focus', async () => {
    const user = userEvent.setup();
    render(<DrawerHarness />);
    const opener = screen.getByRole('button', {name: 'Open drawer'});

    await user.click(opener);
    expect(
      screen.getByRole('dialog', {name: 'Navigation'}),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Close'})).toHaveFocus();

    await user.tab({shift: true});
    expect(screen.getByRole('button', {name: 'Last action'})).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(
      screen.queryByRole('dialog', {name: 'Navigation'}),
    ).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('closes from the backdrop and explicit close control', async () => {
    const user = userEvent.setup();
    render(<DrawerHarness />);
    const opener = screen.getByRole('button', {name: 'Open drawer'});

    await user.click(opener);
    await user.click(screen.getByRole('button', {name: 'Close dialog'}));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();

    await user.click(opener);
    await user.click(screen.getByRole('button', {name: /^Close$/}));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});
