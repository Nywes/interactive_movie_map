'use client';
import { useState, useEffect, useRef } from 'react';
import './Presentation.css';
import oscarsDataJson from './oscars-data.json';
import { OscarReveal } from './OscarReveal';

// Définir les types pour les nominés et les sections
type Nominee = {
  actor?: string;
  film: string;
  crew?: string;
  notSeen?: boolean;
};

type Category = {
  name: string;
  nominees: Nominee[];
  my_winner: Nominee | null;
  official_winner: Nominee | null;
};

type OscarsData = {
  year: number;
  categories: Category[];
};

export const Presentation = () => {
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const [highlightedWinners, setHighlightedWinners] = useState<{ [key: string]: boolean }>({});
  const [showingReveal, setShowingReveal] = useState<string | null>(null);
  const [animatedCategories, setAnimatedCategories] = useState<{ [key: string]: boolean }>({});
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [validImagePaths, setValidImagePaths] = useState<{ [key: string]: boolean }>({});
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const scrollTimeout = useRef<number | undefined>(undefined);

  // Use the imported data
  const oscarsData: OscarsData = oscarsDataJson;
  const { year, categories } = oscarsData;

  const checkImageExists = (imagePath: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = imagePath;
    });
  };

  const getActorImagePath = async (actorName: string | undefined) => {
    if (!actorName) return undefined;

    // If we've already checked this actor, return from cache
    if (Object.prototype.hasOwnProperty.call(validImagePaths, actorName)) {
      return validImagePaths[actorName]
        ? `/actors/${actorName
            .replace(/\s+/g, '-')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')}.jpg`
        : undefined;
    }

    // Convert actor name to filename format
    const fileName = actorName
      .replace(/\s+/g, '-')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const imagePath = `/actors/${fileName}.jpg`;

    // Check if image exists
    const exists = await checkImageExists(imagePath);

    // Cache the result
    setValidImagePaths((prev) => ({
      ...prev,
      [actorName]: exists,
    }));

    return exists ? imagePath : undefined;
  };

  // Preload all actor images on component mount
  useEffect(() => {
    const preloadActorImages = async () => {
      const actorNames = new Set<string>();
      categories.forEach((category) => {
        category.nominees.forEach((nominee) => {
          if (nominee.actor) {
            actorNames.add(nominee.actor);
          }
        });
      });

      const results = await Promise.all(
        Array.from(actorNames).map(async (actorName) => {
          const path = await getActorImagePath(actorName);
          return [actorName, !!path] as [string, boolean];
        })
      );

      setValidImagePaths(Object.fromEntries(results));
    };

    preloadActorImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  // Modified version of the component that uses the cached image paths
  const getActorImagePathSync = (actorName: string | undefined) => {
    if (!actorName || !validImagePaths[actorName]) return undefined;

    return `/actors/${actorName
      .replace(/\s+/g, '-')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')}.jpg`;
  };

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDiff = Math.abs(currentScrollY - lastScrollY);

      // If we're in the middle of an animation and the scroll is significant (> 50px)
      if (isAnimating && scrollDiff > 50) {
        // Cancel the animation smoothly
        if (showingReveal) {
          handleRevealComplete();
        }
      }

      setLastScrollY(currentScrollY);
      setScrollY(currentScrollY);

      // Clear existing timeout
      if (scrollTimeout.current) {
        window.clearTimeout(scrollTimeout.current);
      }

      // Set new timeout to update scroll state after scrolling stops
      scrollTimeout.current = window.setTimeout(() => {
        setLastScrollY(window.scrollY);
      }, 150);
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) {
        window.clearTimeout(scrollTimeout.current);
      }
    };
  }, [lastScrollY, isAnimating, showingReveal]);

  // Effet pour changer de section en fonction du défilement
  useEffect(() => {
    const sectionHeight = window.innerHeight;
    const currentSection = Math.floor(scrollY / sectionHeight);
    // We add 1 to account for the intro section, but we don't want to exceed categories.length + 1
    setActiveSection(Math.min(currentSection, categories.length + 1));

    // Add fade effect to intro section background
    const introSection = document.querySelector('.intro-section');
    if (introSection) {
      if (scrollY > window.innerHeight * 0.3) {
        introSection.classList.add('fade-out');
      } else {
        introSection.classList.remove('fade-out');
      }
    }
  }, [scrollY, categories.length]);

  // Fonction pour naviguer vers une section spécifique
  const navigateToSection = (index: number) => {
    if (sectionRefs.current[index]) {
      sectionRefs.current[index]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  const revealWinner = (categoryName: string) => {
    // Only show reveal animation if it hasn't been shown before
    if (!animatedCategories[categoryName]) {
      setShowingReveal(categoryName);
      setIsAnimating(true);
      setAnimatedCategories((prev) => ({
        ...prev,
        [categoryName]: true,
      }));
    } else {
      // If already animated, just update the highlighted winners immediately
      setHighlightedWinners((prev) => ({
        ...prev,
        [categoryName]: true,
      }));
    }
  };

  const handleRevealComplete = () => {
    if (showingReveal) {
      setHighlightedWinners((prev) => ({
        ...prev,
        [showingReveal]: true,
      }));
      setShowingReveal(null);
      setIsAnimating(false);
    }
  };

  const isWinner = (categoryName: string, nominee: Nominee) => {
    const category = categories.find((c) => c.name === categoryName);
    if (!category || !category.my_winner) return false;

    return (
      category.my_winner.film === nominee.film &&
      category.my_winner.actor === nominee.actor &&
      category.my_winner.crew === nominee.crew &&
      highlightedWinners[categoryName]
    );
  };

  // Fonction pour assigner les refs correctement
  const assignRef = (index: number) => (el: HTMLElement | null) => {
    sectionRefs.current[index] = el;
  };

  const getNomineeTitle = (nominee: Nominee) => {
    if (nominee.actor && nominee.film) return nominee.actor;
    return nominee.film;
  };

  const getNomineeDescription = (nominee: Nominee) => {
    if (nominee.actor) return nominee.film;
    if (nominee.crew) return nominee.crew;
    return nominee.actor;
  };

  const isNotSeen = (film: string): boolean => {
    return [
      'A Real Pain',
      'The Apprentice',
      'Sing Sing',
      'Gladiator II',
      'A Different Man',
      'Elton John: Never Too Late',
      'The Six Triple Eight',
      'Better Man',
      'September 5',
      'The Girl with the Needle',
      'The Seed of the Sacred Fig',
      'Memoir of a Snail',
      'Wallace & Gromit',
    ].includes(film);
  };

  return (
    <div className="oscars-presentation">
      <div className="intro-section" ref={assignRef(0)}>
        <div className="flex flex-col items-center justify-center">
          <h1>Ma Présentation des</h1>
          <div className="oscars-text-logo" />
          <h2 className="year-text">{year}</h2>
        </div>
        <p className="intro-text">
          Bienvenue dans ma présentation personnelle des Oscars {year}. Découvrez mes nominations et
          mes choix de gagnants pour chaque catégorie. Faites défiler pour explorer les différentes
          catégories.
        </p>
        <div className="scroll-indicator" onClick={() => navigateToSection(1)}>
          <span>Défiler</span>
          <div className="scroll-arrow"></div>
        </div>
      </div>

      {categories.map((category, index) => (
        <section
          key={category.name}
          className={`category-section ${activeSection === index + 1 ? 'active' : ''}`}
          id={`section-${index + 1}`}
          ref={assignRef(index + 1)}
        >
          <div className="category-content">
            <h2 className="category-title">{category.name}</h2>

            <div
              className={`${
                category.name === 'Best Picture' ? 'best-picture-container' : 'nominees-container'
              }`}
            >
              {category.nominees.map((nominee, index) => (
                <div
                  key={index}
                  className={`nominee-card ${
                    isWinner(category.name, nominee) ? 'winner-card' : ''
                  } ${isNotSeen(nominee.film) ? 'not-seen-card' : ''} ${
                    highlightedWinners[category.name] && !isWinner(category.name, nominee)
                      ? 'losing-nominee'
                      : ''
                  }`}
                >
                  <div className="nominee-info">
                    <div className="nominee-title">{getNomineeTitle(nominee)}</div>
                    <div className="nominee-description">{getNomineeDescription(nominee)}</div>
                  </div>
                  {isNotSeen(nominee.film) && (
                    <div
                      className="not-seen-indicator"
                      style={{
                        right: getActorImagePathSync(nominee.actor)
                          ? 'min(8vh, 70px)'
                          : 'min(8vh, 10px)',
                      }}
                    >
                      NOT SEEN
                    </div>
                  )}
                  {isWinner(category.name, nominee) && (
                    <img
                      src="/Oscar-Statuette-Logo.png"
                      alt="Oscar Statuette"
                      className="oscar-statuette"
                    />
                  )}
                  {getActorImagePathSync(nominee.actor) && (
                    <img
                      src={getActorImagePathSync(nominee.actor)}
                      alt={nominee.actor}
                      className="nominee-image"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              className="reveal-winner-btn"
              onClick={() => revealWinner(category.name)}
              disabled={!category.my_winner}
            >
              Révéler mon choix
            </button>

            {showingReveal === category.name && (
              <OscarReveal isActive={true} onAnimationComplete={handleRevealComplete} />
            )}
          </div>
        </section>
      ))}

      <footer className="oscars-footer">
        <p>© {year} Ma Présentation des Oscars</p>
      </footer>
    </div>
  );
};
