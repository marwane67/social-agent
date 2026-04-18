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
      title="Anas Ben Abdelmoumen — Échevin à la Ville de Bruxelles"
      description="Site officiel d'Anas Ben Abdelmoumen, échevin des Finances et de la Propreté publique à la Ville de Bruxelles (PS). Actualités, vidéos, contact."
    >
      <Hero />
      <Newsletter />
      <FeaturedNote />
      <NotesList limit={4} showMore moreHref="/echevin/notes" />
      <VideosSection />
      <ContactSection />
    </EchevinLayout>
  );
}
