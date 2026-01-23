import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { useIsMobile } from '../hooks/useMediaQuery';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = useIsMobile();

  // Show button when page is scrolled up to given distance
  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Set the top coordinate to 0
  // Make scrolling smooth
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  // Only show on mobile devices
  if (!isMobile) {
    return null;
  }

  return (
    <button
      className={`back-to-top ${isVisible ? 'visible' : 'hidden'}`}
      onClick={scrollToTop}
      aria-label="Back to top"
      title="Back to top"
    >
      <ArrowUp size={20} />
    </button>
  );
}