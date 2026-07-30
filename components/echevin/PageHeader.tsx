import StackedNav from './StackedNav';

type Props = {
  surtitle: string;
  title: string;
  image?: string;
  hideMobileNavLogo?: boolean;
};

export default function PageHeader({
  surtitle,
  title,
  image = '/anas.jpg',
  hideMobileNavLogo = false,
}: Props) {
  return (
    <section className={`ec-page-header${hideMobileNavLogo ? ' ec-page-header--hide-mobile-nav-logo' : ''}`}>
      <div
        className="ec-page-header__bg"
        style={{ backgroundImage: `url(${image})` }}
      />
      <div className="ec-page-header__overlay" />

      <div className="ec-page-header__nav">
        <StackedNav floating />
      </div>

      <div className="ec-page-header__content">
        <p className="ec-page-header__surtitle">{surtitle}</p>
        <h1 className="ec-page-header__title">{title}</h1>
        <div className="ec-page-header__line" />
      </div>
    </section>
  );
}
