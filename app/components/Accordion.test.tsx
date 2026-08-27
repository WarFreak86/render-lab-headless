import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Accordion} from '~/components/Accordion';

describe('Accordion', () => {
  it('toggles its expanded state from the keyboard', async () => {
    const user = userEvent.setup();
    render(<Accordion title="Materials">Museum-grade aluminum.</Accordion>);

    const trigger = screen.getByRole('button', {name: 'Materials'});
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.tab();
    expect(trigger).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region', {name: 'Materials'})).toHaveAttribute('aria-hidden', 'false');
  });
});
