import { useEffect, useState } from 'react';
import './OscarReveal.css';

interface OscarRevealProps {
  isActive: boolean;
  onAnimationComplete: () => void;
}

export const OscarReveal = ({ isActive, onAnimationComplete }: OscarRevealProps) => {
  const [animationState, setAnimationState] = useState<
    'initial' | 'closing' | 'showing-text' | 'opening'
  >('initial');
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    if (isActive) {
      // Reset states
      setAnimationState('initial');
      setShowText(false);

      // Start closing curtains
      const closingTimer = setTimeout(() => {
        setAnimationState('closing');
      }, 100);

      // Show text after curtains are closed
      const textStartTimer = setTimeout(() => {
        setAnimationState('showing-text');
        setShowText(true);
      }, 1700); // 1.5s for curtain + 0.2s buffer

      // Hide text and prepare for opening
      const textEndTimer = setTimeout(() => {
        setShowText(false);
      }, 5700); // 1.7s + 4s text display

      // Open curtains after text is fully hidden
      const openingTimer = setTimeout(() => {
        setAnimationState('opening');
      }, 6700); // 5.7s + 1s for text fade out

      // Complete the animation
      const completeTimer = setTimeout(() => {
        onAnimationComplete();
      }, 8200); // 6.7s + 1.5s for curtain opening

      return () => {
        clearTimeout(closingTimer);
        clearTimeout(textStartTimer);
        clearTimeout(textEndTimer);
        clearTimeout(openingTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [isActive, onAnimationComplete]);

  if (!isActive) return null;

  return (
    <div className={`oscar-reveal ${animationState}`}>
      <div className="oscar-reveal__wrapper">
        <div className="oscar-reveal__panel oscar-reveal__panel--left" />
        <div className="oscar-reveal__panel oscar-reveal__panel--right" />
        <div className="oscar-reveal__content">
          <div className={`oscar-reveal__text ${showText ? 'visible' : ''}`}>
            And my Oscar goes to...
          </div>
        </div>
      </div>
    </div>
  );
};
