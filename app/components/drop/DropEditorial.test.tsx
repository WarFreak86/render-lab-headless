import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DropCollectorBenefits,
  DropEdition,
  DropSizeGuide,
  DropStory,
} from './DropEditorial';

vi.mock('@shopify/hydrogen', () => ({
  Image: ({alt, data}: {alt: string; data: {url: string}}) => (
    <img alt={alt} src={data.url} />
  ),
}));

describe('drop editorial modules', () => {
  it('hides the story when merchant content is absent', () => {
    render(<DropStory />);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('renders a configured story with real media alt text', () => {
    render(
      <DropStory
        bodyHtml="<p>Merchant product description.</p>"
        heading="The garment"
        image={{
          id: 'media-1',
          url: '/hoodie.jpg',
          altText: 'Marine hoodie back view',
        }}
      />,
    );
    expect(screen.getByRole('heading', {name: 'The garment'})).toBeInTheDocument();
    expect(screen.getByText('Merchant product description.')).toBeInTheDocument();
    expect(screen.getByRole('img', {name: 'Marine hoodie back view'})).toBeInTheDocument();
  });

  it('hides collector benefits when claims are absent', () => {
    render(<DropCollectorBenefits benefits={[]} />);
    expect(screen.queryByRole('heading', {name: 'Release details'})).not.toBeInTheDocument();
  });

  it('renders only explicitly configured collector benefits', () => {
    render(
      <DropCollectorBenefits
        benefits={[
          {title: 'Configured claim', description: 'Merchant-backed detail.'},
        ]}
      />,
    );
    expect(screen.getByText('Configured claim')).toBeInTheDocument();
    expect(screen.getByText('Merchant-backed detail.')).toBeInTheDocument();
  });

  it('hides edition information when structured data is absent', () => {
    render(<DropEdition />);
    expect(screen.queryByText(/Edition size/)).not.toBeInTheDocument();
  });

  it('renders edition size only from configured data', () => {
    render(<DropEdition edition={{label: 'Studio edition', size: 24}} />);
    expect(screen.getByText('Edition size: 24')).toBeInTheDocument();
  });

  it('hides the size guide without legitimate measurements or notes', () => {
    render(<DropSizeGuide />);
    expect(screen.queryByRole('button', {name: 'Size guide'})).not.toBeInTheDocument();
  });

  it('opens and closes the accessible size guide drawer when configured', async () => {
    const user = userEvent.setup();
    render(
      <DropSizeGuide
        guide={{title: 'Merchant size guide', notes: ['Actual garment note.']}}
      />,
    );
    await user.click(screen.getByRole('button', {name: 'Size guide'}));
    expect(
      screen.getByRole('dialog', {name: 'Merchant size guide'}),
    ).toBeInTheDocument();
    expect(screen.getByText('Actual garment note.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'Close'}));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not render an unapproved video section', () => {
    const {container} = render(
      <>
        <DropCollectorBenefits benefits={[]} />
        <DropStory />
        <DropEdition />
      </>,
    );
    expect(container.querySelector('video')).toBeNull();
    expect(screen.queryByRole('heading', {name: /video/i})).not.toBeInTheDocument();
  });
});
