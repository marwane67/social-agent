import EchevinLayout from '../../components/echevin/EchevinLayout';
import Hero from '../../components/echevin/Hero';
import Newsletter from '../../components/echevin/Newsletter';
import FeaturedNote from '../../components/echevin/FeaturedNote';
import NotesList from '../../components/echevin/NotesList';
import VideosSection from '../../components/echevin/VideosSection';
import ContactSection from '../../components/echevin/ContactSection';

export default function EchevinHome() {
  return (
    <EchevinLayout
      title="Prénom Nom — Échevin de [Commune]"
      description="Site officiel de Prénom Nom, Échevin de [Commune]. Actualités, vidéos, contact."
    >
      <Hero />
      <Newsletter />
      <FeaturedNote />
      <NotesList />
      <VideosSection />
      <ContactSection />
    </EchevinLayout>
  );
}
