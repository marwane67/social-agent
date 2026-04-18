import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import { isAuthedSSR } from '../../../lib/auth';
import ArticlesTab from '../../../components/admin/ArticlesTab';
import VideosTab from '../../../components/admin/VideosTab';
import BioTab from '../../../components/admin/BioTab';
import SettingsTab from '../../../components/admin/SettingsTab';

type Tab = 'articles' | 'videos' | 'bio' | 'settings';

export default function AdminHome() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('articles');

  const logout = useCallback(async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/echevin/admin/login');
  }, [router]);

  useEffect(() => {
    const t = router.query.tab as Tab | undefined;
    if (t && ['articles', 'videos', 'bio', 'settings'].includes(t)) setTab(t);
  }, [router.query.tab]);

  return (
    <>
      <Head>
        <title>Admin — Anas Ben Abdelmoumen</title>
      </Head>
      <div className="ec-admin">
        <header className="ec-admin__header">
          <div className="ec-admin__brand">
            <strong>Admin</strong> <span>Anas Ben Abdelmoumen</span>
          </div>
          <nav className="ec-admin__tabs">
            <button className={tab === 'articles' ? 'is-active' : ''} onClick={() => setTab('articles')}>
              Actualités
            </button>
            <button className={tab === 'videos' ? 'is-active' : ''} onClick={() => setTab('videos')}>
              Vidéos
            </button>
            <button className={tab === 'bio' ? 'is-active' : ''} onClick={() => setTab('bio')}>
              Bio
            </button>
            <button className={tab === 'settings' ? 'is-active' : ''} onClick={() => setTab('settings')}>
              Paramètres
            </button>
          </nav>
          <div className="ec-admin__actions">
            <a href="/echevin" target="_blank" rel="noopener noreferrer" className="ec-admin__view">
              Voir le site ↗
            </a>
            <button onClick={logout} className="ec-admin__logout">
              Déconnexion
            </button>
          </div>
        </header>
        <main className="ec-admin__main">
          {tab === 'articles' && <ArticlesTab />}
          {tab === 'videos' && <VideosTab />}
          {tab === 'bio' && <BioTab />}
          {tab === 'settings' && <SettingsTab />}
        </main>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  if (!isAuthedSSR(ctx)) {
    return { redirect: { destination: '/echevin/admin/login', permanent: false } };
  }
  return { props: {} };
};
