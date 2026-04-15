// PLACEHOLDER : remplir avec les vrais liens sociaux de l'échevin
const SOCIAL_LINKS = [
  { platform: 'facebook', href: '#', label: 'Facebook', icon: 'f' },
  { platform: 'instagram', href: '#', label: 'Instagram', icon: 'ig' },
  { platform: 'youtube', href: '#', label: 'Youtube', icon: '▶' },
  { platform: 'linkedin', href: '#', label: 'Linkedin', icon: 'in' },
  { platform: 'x-twitter', href: '#', label: 'X', icon: '𝕏' },
  { platform: 'tiktok', href: '#', label: 'TikTok', icon: '♪' },
];

export default function SocialRow() {
  return (
    <ul className="ec-social-row">
      {SOCIAL_LINKS.map((s) => (
        <li key={s.platform}>
          <a
            href={s.href}
            className={s.platform}
            aria-label={s.label}
            target="_blank"
            rel="noopener noreferrer"
          >
            {s.icon}
          </a>
        </li>
      ))}
    </ul>
  );
}
