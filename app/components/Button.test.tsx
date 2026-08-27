import {render, screen} from '@testing-library/react';
import {Button} from '~/components/Button';

describe('Button', () => {
  it('renders visual variants', () => {
    const {rerender} = render(<Button variant="primary">Collect</Button>);
    expect(screen.getByRole('button', {name: 'Collect'})).toHaveClass('button--primary');

    rerender(<Button variant="secondary">View details</Button>);
    expect(screen.getByRole('button', {name: 'View details'})).toHaveClass('button--secondary');

    rerender(<Button variant="text">Learn more</Button>);
    expect(screen.getByRole('button', {name: 'Learn more'})).toHaveClass('button--text');
  });

  it('disables interaction for disabled and loading states', () => {
    const {rerender} = render(<Button disabled>Unavailable</Button>);
    expect(screen.getByRole('button', {name: 'Unavailable'})).toBeDisabled();

    rerender(<Button loading>Adding</Button>);
    expect(screen.getByRole('button', {name: 'Adding'})).toBeDisabled();
    expect(screen.getByRole('button', {name: 'Adding'})).toHaveAttribute('aria-busy', 'true');
  });
});
