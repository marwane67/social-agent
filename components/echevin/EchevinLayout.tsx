import Head from 'next/head';
import Header from './Header';
import Footer from './Footer';

interface EchevinLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export default function EchevinLayout({
  children,
  title = 'Anas Ben Abdelmoumen — Échevin à la Ville de Bruxelles',
  description = "Site officiel d'Anas Ben Abdelmoumen, échevin des Finances et de la Propreté publique à la Ville de Bruxelles (PS).",
}: EchevinLayoutProps) {
  return (
    <div className="ec-site">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
