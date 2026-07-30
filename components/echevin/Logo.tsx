// Logo "Anas Ben / ABDELMOUMEN" :
// - "Anas Ben" en petit au-dessus (Montserrat regular)
// - "ABDELMOUMEN" en énorme en-dessous (Anton condensé majuscules)
// - Barre verticale colorée à gauche (couleurs PS)
interface LogoProps {
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: { firstName: 14, lastName: 38, barWidth: 8 },
  md: { firstName: 22, lastName: 76, barWidth: 14 },
  lg: { firstName: 30, lastName: 100, barWidth: 18 },
};

export default function Logo({ variant = 'dark', size = 'md' }: LogoProps) {
  const s = SIZES[size];
  const color = variant === 'light' ? '#FFFFFF' : '#000000';

  return (
    <div
      className={`ec-logo ec-logo--${size} ec-logo--${variant}`}
      style={{
        display: 'inline-flex',
        alignItems: 'stretch',
        gap: 0,
        lineHeight: 1,
        fontFamily: 'Montserrat, sans-serif',
      }}
    >
      <div
        className="ec-logo__bar"
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
      <div className="ec-logo__text" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          className="ec-logo__first"
          style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 500,
            fontSize: s.firstName,
            color,
            letterSpacing: '-0.01em',
            lineHeight: 1,
          }}
        >
          Anas Ben
        </span>
        <span
          className="ec-logo__last"
          style={{
            fontFamily: 'Anton, Impact, sans-serif',
            fontSize: s.lastName,
            color,
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
