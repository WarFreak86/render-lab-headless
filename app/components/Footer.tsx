import {Suspense} from 'react';
import {Await, NavLink} from 'react-router';
import type {FooterQuery, HeaderQuery} from 'storefrontapi.generated';
import {Container} from '~/components/Container';
import {SITE_NAME} from '~/lib/config';

interface FooterProps {
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  publicStoreDomain: string;
}

export function Footer({footer: footerPromise, header, publicStoreDomain}: FooterProps) {
  return (
    <footer className="site-footer">
      <Container className="site-footer__grid" size="wide">
        <div className="site-footer__brand">
          <NavLink className="brand-mark" to="/">RENDER-LAB</NavLink>
          <p>Art, editions, and objects selected for considered spaces.</p>
        </div>
        <FooterLinkGroup title="Explore">
          <NavLink to="/collections">Collections</NavLink>
          <NavLink to="/collections/wall-art">Wall Art</NavLink>
          <NavLink to="/collections/bundles">Bundles</NavLink>
        </FooterLinkGroup>
        <FooterLinkGroup title="Support">
          <NavLink to="/account">Account</NavLink>
          <NavLink to="/cart">Cart</NavLink>
          <NavLink to="/search">Search</NavLink>
        </FooterLinkGroup>
        <div>
          <h2 className="site-footer__heading">Policies</h2>
          <nav className="site-footer__links" aria-label="Rights and intellectual property">
            <NavLink to="/legal/rights-notice">Rights &amp; Intellectual Property</NavLink>
          </nav>
          <Suspense fallback={null}>
            <Await resolve={footerPromise}>
              {(footer) => (
                <FooterMenu
                  footer={footer}
                  header={header}
                  publicStoreDomain={publicStoreDomain}
                />
              )}
            </Await>
          </Suspense>
        </div>
      </Container>
      <Container className="site-footer__rights" size="wide">
        <p>
          Render-Lab features artwork created by independent artists. Some works may
          reference third-party trademarks, copyrighted material, public figures, or
          other protected subject matter. Unless expressly stated, no affiliation,
          endorsement, sponsorship, or authorization by a third-party rights holder is
          claimed or implied.{' '}
          <NavLink to="/legal/rights-notice">Read the rights notice.</NavLink>
        </p>
      </Container>
      <Container className="site-footer__bottom" size="wide">
        <p>© {new Date().getFullYear()} {SITE_NAME}</p>
        <p>Shopify-powered commerce</p>
      </Container>
    </footer>
  );
}

function FooterLinkGroup({children, title}: {children: React.ReactNode; title: string}) {
  return (
    <div>
      <h2 className="site-footer__heading">{title}</h2>
      <nav className="site-footer__links" aria-label={title}>{children}</nav>
    </div>
  );
}

function FooterMenu({footer, header, publicStoreDomain}: {
  footer: FooterQuery | null;
  header: HeaderQuery;
  publicStoreDomain: string;
}) {
  if (!footer?.menu) return null;
  const primaryDomainUrl = header.shop.primaryDomain.url;
  return (
    <nav className="site-footer__links site-footer__links--policy-menu" aria-label="Store policies">
      {footer.menu.items.map((item) => {
        if (!item.url) return null;
        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;
        return !url.startsWith('/') ? (
          <a href={url} key={item.id} rel="noopener noreferrer" target="_blank">
            {item.title}
          </a>
        ) : (
          <NavLink key={item.id} to={url}>{item.title}</NavLink>
        );
      })}
    </nav>
  );
}
