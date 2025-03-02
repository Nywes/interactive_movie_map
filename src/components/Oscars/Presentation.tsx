'use client';
import { useState, useEffect, useRef } from 'react';
import './Presentation.css';
import oscarsDataJson from './oscars-data.json';
import { OscarReveal } from './OscarReveal';
import { YouTubeModal } from './YouTubeModal';
import { MissingPoster } from './MissingPoster';

// Définir les types pour les nominés et les sections
type Nominee = {
  actor?: string;
  film: string;
  crew?: string;
  notSeen?: boolean;
  trailer?: string;
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
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

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

  // Preload all images on component mount
  useEffect(() => {
    const preloadImages = async () => {
      const actorNames = new Set<string>();
      const filmNames = new Set<string>();

      categories.forEach((category) => {
        category.nominees.forEach((nominee) => {
          if (nominee.actor) {
            actorNames.add(nominee.actor);
          }
          if (nominee.film) {
            filmNames.add(nominee.film);
          }
        });
      });

      const results = await Promise.all([
        ...Array.from(actorNames).map(async (actorName) => {
          const path = await checkImageExists(
            `/actors/${actorName
              .replace(/\s+/g, '-')
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')}.jpg`
          );
          return [actorName, path] as [string, boolean];
        }),
        ...Array.from(filmNames).map(async (filmName) => {
          const path = await checkImageExists(
            `/films/${filmName
              .replace(/\s+/g, '-')
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')}.jpg`
          );
          return [filmName, path] as [string, boolean];
        }),
      ]);

      setValidImagePaths(Object.fromEntries(results));
    };

    preloadImages();
  }, [categories]);

  // Modified version of the component that uses the cached image paths
  const getActorImagePathSync = (actorName: string | undefined) => {
    if (!actorName || !validImagePaths[actorName]) return undefined;

    return `/actors/${actorName
      .replace(/\s+/g, '-')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')}.jpg`;
  };

  // Modified version of the component that uses the cached image paths
  const getFilmImagePathSync = (filmName: string | undefined) => {
    console.log(filmName);
    if (!filmName || !validImagePaths[filmName]) return undefined;

    console.log(filmName);
    console.log(
      `/films/${filmName
        .replace(/\s+/g, '-')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')}.jpg`
    );

    return `/films/${filmName
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // If it's the Music (Original Score) category, show the video
      if (showingReveal === 'Music (Original Score)') {
        setSelectedVideoId('2TAZJHgGt_c');
      }
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
      'Like a Bird',
      'Never Too Late',
      'The Journey',
    ].includes(film);
  };

  // Function to search for movie trailer on YouTube
  const searchTrailer = async (movieTitle: string) => {
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    if (!apiKey) {
      console.error('YouTube API key is not configured');
      return null;
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(
          movieTitle + ' trailer official'
        )}&type=video&key=${apiKey}`
      );
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        return data.items[0].id.videoId;
      }
      return null;
    } catch (error) {
      console.error('Error searching YouTube:', error);
      return null;
    }
  };

  // Handle nominee card click
  const handleNomineeClick = async (nominee: Nominee) => {
    if (nominee.trailer) {
      // Extract video ID from YouTube URL
      const videoId = nominee.trailer.match(
        /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
      )?.[1];
      if (videoId) {
        setSelectedVideoId(videoId);
        return;
      }
    }

    // Fallback to search if no trailer URL or invalid URL
    const videoId = await searchTrailer(nominee.film);
    setSelectedVideoId(videoId);
  };

  // Handle YouTube modal close
  const handleModalClose = () => {
    setSelectedVideoId(null);
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
                  } ${!nominee.actor ? 'with-film-image' : ''}`}
                  onClick={() => handleNomineeClick(nominee)}
                >
                  <div className="nominee-info">
                    <div className="nominee-title">{getNomineeTitle(nominee)}</div>
                    <div className="nominee-description">{getNomineeDescription(nominee)}</div>
                  </div>
                  {isNotSeen(nominee.film) && (
                    <div
                      className="not-seen-indicator"
                      style={{
                        position: 'absolute',
                        top: '4px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        right: 'auto',
                      }}
                    >
                      NOT SEEN
                    </div>
                  )}
                  {isWinner(category.name, nominee) && (
                    <img
                      src="/Oscar-Statuette-Logo.png"
                      alt="Oscar Statuette"
                      className={`oscar-statuette ${nominee.actor ? 'with-actor' : 'with-film'}`}
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
                  {!nominee.actor && getFilmImagePathSync(nominee.film) && (
                    <img
                      src={getFilmImagePathSync(nominee.film)}
                      alt={nominee.film}
                      className="nominee-image film-image"
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
              Reaveal my choice
            </button>

            {showingReveal === category.name && (
              <OscarReveal isActive={true} onAnimationComplete={handleRevealComplete} />
            )}
          </div>
        </section>
      ))}

      <YouTubeModal videoId={selectedVideoId} onClose={handleModalClose} />
      <footer className="oscars-footer">
        <p className="pl-4">© {year} made by Eliott RIVET</p>

        <div className="missing-poster-container pt-40" style={{ margin: '40px auto' }}>
          <MissingPoster
            name="CHALLENGERS"
            lastSeen="APRIL 29, 2024"
            photoUrl="/films/Challengers.jpg"
          />
        </div>
      </footer>
    </div>
  );
};
