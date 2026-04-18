// Logo inspire du design de Manuel Bompard :
// - Prenom en petit sans-serif regulier au-dessus
// - NOM en enorme, bold, condensed, majuscules
// - Barre coloree verticale decorative a gauche (couleurs PS)
interface LogoProps {
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: { firstName: 14, lastName: 32, barWidth: 8 },
  md: { firstName: 20, lastName: 52, barWidth: 12 },
  lg: { firstName: 28, lastName: 72, barWidth: 16 },
};

export default function Logo({ variant = 'dark', size = 'md' }: LogoProps) {
  const s = SIZES[size];
  const textColor = variant === 'light' ? '#FFFFFF' : '#000000';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'stretch',
        gap: 0,
        lineHeight: 1,
        fontFamily: 'Montserrat, sans-serif',
      }}
    >
      {/* Barre coloree verticale a gauche (degrade PS : turquoise -> rouge -> rose) */}
      <div
        style={{
          width: s.barWidth,
          minHeight: s.lastName + 4,
          marginRight: 10,
          background:
            'linear-gradient(180deg, #009AA3 0%, #FF0000 50%, #E5B5DC 100%)',
          borderRadius: 2,
          flexShrink: 0,
        }}
      />

      {/* Texte : prenom + nom */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 500,
            fontSize: s.firstName,
            color: textColor,
            letterSpacing: '-0.01em',
            lineHeight: 1,
            textTransform: 'none',
            fontStyle: 'normal',
          }}
        >
          Anas Ben
        </span>
        <span
          style={{
            fontFamily: 'Anton, Impact, sans-serif',
            fontSize: s.lastName,
            color: textColor,
            letterSpacing: '0.01em',
            lineHeight: 0.9,
            textTransform: 'uppercase',
            fontWeight: 400,
          }}
        >
          ABDELMOUMEN
        </span>
      </div>
    </div>
  );
}
