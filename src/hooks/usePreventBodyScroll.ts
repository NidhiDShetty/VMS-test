import { useEffect } from 'react';

/**
 * Custom hook to prevent body scrolling when a modal is open
 * @param isOpen - Whether the modal is open
 */
export const usePreventBodyScroll = (isOpen: boolean) => {
  useEffect(() => {
    if (isOpen) {
      // Store the current values
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      const originalPosition = document.body.style.position;
      const originalTop = document.body.style.top;
      const originalLeft = document.body.style.left;
      const originalRight = document.body.style.right;
      const originalWidth = document.body.style.width;
      const originalHeight = document.body.style.height;
      
      // Get the scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // Get current scroll position
      const scrollY = window.scrollY;
      
      // Add CSS class to body
      document.body.classList.add('modal-open');
      
      // Prevent scrolling and add padding to prevent layout shift
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      
      // Cleanup function to restore scrolling when modal closes
      return () => {
        // Remove CSS class
        document.body.classList.remove('modal-open');
        
        // Restore original styles
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
        document.body.style.position = originalPosition;
        document.body.style.top = originalTop;
        document.body.style.left = originalLeft;
        document.body.style.right = originalRight;
        document.body.style.width = originalWidth;
        document.body.style.height = originalHeight;
        
        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);
};

export default usePreventBodyScroll;
