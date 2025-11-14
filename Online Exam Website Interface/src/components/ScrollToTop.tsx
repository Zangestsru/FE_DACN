import { useEffect } from 'react';

interface ScrollToTopProps {
  currentPage: string;
}

export function ScrollToTop({ currentPage }: ScrollToTopProps) {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }, [currentPage]);

  return null;
}