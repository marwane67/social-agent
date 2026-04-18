import EchevinLayout from '../../../components/echevin/EchevinLayout';
import PageHeader from '../../../components/echevin/PageHeader';
import NotesList from '../../../components/echevin/NotesList';

export default function EchevinNotes() {
  return (
    <EchevinLayout
      title="Actualités — Anas Ben Abdelmoumen"
      description="Toutes les actualités d'Anas Ben Abdelmoumen, échevin à la Ville de Bruxelles."
    >
      <PageHeader surtitle="Mes publications" title="Actualités" image="/anas.jpg" />
      <NotesList />
    </EchevinLayout>
  );
}
