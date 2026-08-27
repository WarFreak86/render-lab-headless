import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router';
import {AnnouncementBar} from '~/components/AnnouncementBar';
import {Container} from '~/components/Container';

describe('application shell', () => {
  it('renders the global announcement and container foundation', () => {
    render(
      <MemoryRouter>
        <AnnouncementBar message="Studio update" />
        <main>
          <Container size="standard">Foundation content</Container>
        </main>
      </MemoryRouter>,
    );
    expect(screen.getByRole('region', {name: 'Announcement'})).toHaveTextContent('Studio update');
    expect(screen.getByText('Foundation content')).toHaveClass('container--standard');
  });
});
