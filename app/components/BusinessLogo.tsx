'use client';

import { useEffect, useMemo, useState } from 'react';

export default function BusinessLogo({ name, website }: { name: string; website?: string | null }) {
  const [failed, setFailed] = useState(false);
  const initials = useMemo(() => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'LB', [name]);
  const favicon = useMemo(() => {
    if (!website) return '';
    try {
      const normalized = /^https?:\/\//i.test(website) ? website : `https://${website}`;
      const domain = new URL(normalized).hostname.replace(/^www\./i, '');
      if (!domain) return '';
      return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
    } catch {
      return '';
    }
  }, [website]);

  useEffect(() => {
    setFailed(false);
  }, [name, website]);

  if (!favicon || failed) {
    return <div className="businessLogo businessLogoFallback" aria-label={`${name} logo placeholder`}>{initials}</div>;
  }

  return <img className="businessLogo" src={favicon} alt={`${name} logo`} onError={() => setFailed(true)} />;
}
