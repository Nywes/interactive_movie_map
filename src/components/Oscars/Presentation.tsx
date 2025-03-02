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
  photos?: string[];
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
  const [currentImageIndices, setCurrentImageIndices] = useState<{ [key: string]: number }>({});
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const scrollTimeout = useRef<number | undefined>(undefined);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');

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

  const getActorImagePathSync = (actorName: string | undefined, index: number = 0) => {
    if (!actorName) return undefined;

    const baseImagePath = `/actors/${actorName
      .replace(/\s+/g, '-')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')}`;

    const imagePath = index === 0 ? `${baseImagePath}.jpg` : `${baseImagePath}-${index}.jpg`;

    return imagePath;
  };

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

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDiff = Math.abs(currentScrollY - lastScrollY);

      if (isAnimating && scrollDiff > 50) {
        if (showingReveal) {
          handleRevealComplete();
        }
      }

      setLastScrollY(currentScrollY);
      setScrollY(currentScrollY);

      if (scrollTimeout.current) {
        window.clearTimeout(scrollTimeout.current);
      }

      scrollTimeout.current = window.setTimeout(() => {
        setLastScrollY(window.scrollY);
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) {
        window.clearTimeout(scrollTimeout.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastScrollY, isAnimating, showingReveal]);

  useEffect(() => {
    const sectionHeight = window.innerHeight;
    const currentSection = Math.floor(scrollY / sectionHeight);
    setActiveSection(Math.min(currentSection, categories.length + 1));

    const introSection = document.querySelector('.intro-section');
    if (introSection) {
      if (scrollY > window.innerHeight * 0.3) {
        introSection.classList.add('fade-out');
      } else {
        introSection.classList.remove('fade-out');
      }
    }
  }, [scrollY, categories.length]);

  const navigateToSection = (index: number) => {
    if (sectionRefs.current[index]) {
      sectionRefs.current[index]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  const revealWinner = (categoryName: string) => {
    const categoryIndex = categories.findIndex((cat) => cat.name === categoryName);
    const isLastFourCategories = categoryIndex >= categories.length - 4;

    if (!animatedCategories[categoryName] && isLastFourCategories) {
      setShowingReveal(categoryName);
      setIsAnimating(true);
      setAnimatedCategories((prev) => ({
        ...prev,
        [categoryName]: true,
      }));
    } else {
      setHighlightedWinners((prev) => ({
        ...prev,
        [categoryName]: true,
      }));
      if (categoryName === 'Music (Original Score)') {
        setSelectedVideoId('2TAZJHgGt_c');
      }
    }
  };

  const handleRevealComplete = () => {
    if (showingReveal) {
      setHighlightedWinners((prev) => ({
        ...prev,
        [showingReveal]: true,
      }));
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
      'Maria',
    ].includes(film);
  };

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

  const createFallingHeart = () => {
    const element = document.createElement('div');
    element.className = 'falling-heart';

    const size = Math.floor(Math.random() * (50 - 15 + 1)) + 15;
    element.style.width = `${size}px`;
    element.style.height = `${size}px`;

    const generateRandomRed = (baseLightness: number) => {
      const baseHue = 0;
      const saturation = Math.floor(Math.random() * (100 - 85) + 85);
      const lightness = Math.max(0, Math.min(100, baseLightness + (Math.random() * 10 - 5)));
      return `hsl(${baseHue}, ${saturation}%, ${lightness}%)`;
    };

    const gradient = [
      generateRandomRed(65),
      generateRandomRed(55),
      generateRandomRed(45),
      generateRandomRed(35),
      generateRandomRed(30),
      generateRandomRed(25),
      generateRandomRed(20),
    ];

    const gradientString = `linear-gradient(135deg, 
        ${gradient[0]} 0%,
        ${gradient[1]} 20%,
        ${gradient[2]} 35%,
        ${gradient[3]} 50%,
        ${gradient[4]} 65%,
        ${gradient[5]} 80%,
        ${gradient[6]} 100%
      )`;

    element.style.setProperty('--heart-gradient', gradientString);

    const randomLeft = Math.random() * (window.innerWidth - size);
    element.style.left = `${randomLeft}px`;

    const spinAmount = 360 * (Math.floor(Math.random() * 4) + 1);
    element.style.setProperty('--spin-amount', `${spinAmount}deg`);

    document.body.appendChild(element);

    element.addEventListener('animationend', () => {
      document.body.removeChild(element);
    });
  };

  const handleNomineeClick = async (nominee: Nominee) => {
    if (nominee.actor === 'Monica Barbaro') {
      createFallingHeart();
    }
    if (nominee.actor) {
      const nomineeCard = document.querySelector(`[data-actor="${nominee.actor}"]`);
      if (nomineeCard) {
        const categorySection = nomineeCard.closest('.category-section');
        const categoryTitle = categorySection?.querySelector('.category-title')?.textContent;

        if (categoryTitle && categoryTitle !== 'Directing') {
          const image = nomineeCard.querySelector('.nominee-image') as HTMLElement;
          if (image) {
            const actorName = nominee.actor;
            const currentIndex = currentImageIndices[actorName] || 0;
            const totalPhotos = nominee.photos?.length || 1;
            const nextIndex = (currentIndex + 1) % totalPhotos;

            setCurrentImageIndices((prev) => ({
              ...prev,
              [actorName]: nextIndex,
            }));

            image.classList.remove('spinning');
            void image.offsetWidth;
            image.classList.add('spinning');

            const newImagePath = getActorImagePathSync(actorName, nextIndex);
            if (newImagePath) {
              image.setAttribute('src', newImagePath);
            }
          }
        }
      }
    }

    if (nominee.trailer) {
      const videoId = nominee.trailer.match(
        /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
      )?.[1];
      if (videoId) {
        setSelectedVideoId(videoId);
        return;
      }
    }

    const videoId = await searchTrailer(nominee.film);
    setSelectedVideoId(videoId);
  };

  const handleModalClose = () => {
    setSelectedVideoId(null);
  };

  const createHeartAvalanche = () => {
    const startTime = Date.now();
    const duration = 5000;
    const interval = 100;

    const createHeart = () => {
      const element = document.createElement('div');
      element.className = 'falling-heart';

      const size = Math.floor(Math.random() * (50 - 15 + 1)) + 15;
      element.style.width = `${size}px`;
      element.style.height = `${size}px`;

      const generateRandomRed = (baseLightness: number) => {
        const baseHue = 0;
        const saturation = Math.floor(Math.random() * (100 - 85) + 85);
        const lightness = Math.max(0, Math.min(100, baseLightness + (Math.random() * 10 - 5)));
        return `hsl(${baseHue}, ${saturation}%, ${lightness}%)`;
      };

      const gradient = [
        generateRandomRed(65),
        generateRandomRed(55),
        generateRandomRed(45),
        generateRandomRed(35),
        generateRandomRed(30),
        generateRandomRed(25),
        generateRandomRed(20),
      ];

      const gradientString = `linear-gradient(135deg, 
        ${gradient[0]} 0%,
        ${gradient[1]} 20%,
        ${gradient[2]} 35%,
        ${gradient[3]} 50%,
        ${gradient[4]} 65%,
        ${gradient[5]} 80%,
        ${gradient[6]} 100%
      )`;

      element.style.setProperty('--heart-gradient', gradientString);

      const randomLeft = Math.random() * (window.innerWidth - size);
      element.style.left = `${randomLeft}px`;

      const spinAmount = 360 * (Math.floor(Math.random() * 4) + 1);
      element.style.setProperty('--spin-amount', `${spinAmount}deg`);

      document.body.appendChild(element);

      element.addEventListener('animationend', () => {
        document.body.removeChild(element);
      });
    };

    const heartInterval = setInterval(() => {
      if (Date.now() - startTime >= duration) {
        clearInterval(heartInterval);
        return;
      }
      createHeart();
    }, interval);
  };

  const handleLanguageChange = () => {
    if (language === 'fr') {
      setLanguage('en');
    } else {
      setLanguage('fr');
    }
  };

  return (
    <div className="oscars-presentation">
      <div className="intro-section" ref={assignRef(0)}>
        <div className="flex flex-col items-center justify-center mb-12 gap-4">
          <h1>The {year - 1928}th Academy Awards</h1>
          <div className="oscars-text-logo" />
        </div>
        <div className="relative flex flex-col items-center">
          {language === 'fr' ? (
            <p className="text-md">
              Bienvenue dans ma propre cérémonie de remise des Oscars {year}.
              <br />
              Ayant vu une grande partie des films nominés cette année, j'ai fait ça pour vous partager les films que j'ai préféré cette année.
              <br />
              Je vous laisse vous balader et explorer le site en défilant vers le bas.
              <br />
              J'espère que vous aimerez !
            </p>
          ) : (
            <p className="text-md">
              Welcome to my very own {year} Oscars ceremony.
              <br />
              Having watched a large portion of this year's nominated films, I created this to share my favorite films of the year with you.
              <br />
              Feel free to explore by scrolling down.
              <br />I hope you enjoy it!
            </p>
          )}
          <div className="mt-4">
            <div className="language-toggle-btn" onClick={() => handleLanguageChange()}>
              {language === 'fr' ? 'English' : 'Français'}
            </div>
          </div>
        </div>

        <div className="scroll-indicator" onClick={() => navigateToSection(1)}>
          <span>Scroll</span>
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
                  data-actor={nominee.actor}
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
                    <div
                      className={`${
                        category.name === 'Sound' ||
                        category.name === 'Visual Effects' ||
                        category.name === 'Makeup and Hairstyling' ||
                        category.name === 'Music (Original Song)'
                          ? 'nominee-description-sm'
                          : 'nominee-description'
                      }`}
                    >
                      {getNomineeDescription(nominee)}
                    </div>
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
                  {nominee.actor &&
                    getActorImagePathSync(
                      nominee.actor,
                      currentImageIndices[nominee.actor] || 0
                    ) && (
                      <img
                        src={getActorImagePathSync(
                          nominee.actor,
                          currentImageIndices[nominee.actor] || 0
                        )}
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
              className={`reveal-winner-btn ${
                showingReveal === category.name || highlightedWinners[category.name]
                  ? 'revealed'
                  : ''
              }`}
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

      <section className="thanks-section category-section" ref={assignRef(categories.length + 2)}>
        <div className="thanks-content">
          <h2 className="category-title">Thank You</h2>
          <div className="thanks-text flex flex-col letter-spacing-0">
            {language === 'fr' ? (
              <>
                <p>Merci d'avoir suivi ma propre cérémonie de remise des Oscars {year}.</p>
                <p>N'hésitez pas à partager vos avis et vos pronostics !</p>
                <p>
                  Rendez-vous l'année prochaine pour les Oscars {year + 1}, avec un site encore plus
                  abouti, c'est promis !
                </p>
                <p>Et d'ici là je compte sur vous pour aller au cinéma !</p>
              </>
            ) : (
              <>
                <p>Thank you for exploring my personal {year} Oscars rewards.</p>
                <p>Feel free to share your thoughts and predictions!</p>
                <p>
                  See you next year for the Oscars {year + 1}, with an improved website this time, i
                  promise !
                </p>
                <p>And i count on you to go to the movies !</p>
              </>
            )}
          </div>
          <p>
            {language === 'fr' ? `Ajoutez-moi sur Letterboxd :` : 'Add me on Letterboxd :'}
            <a href="https://boxd.it/9eI9r" target="_blank" rel="noopener noreferrer">
              <span className="text-[#FF8000]">https://</span>
              <span className="text-[#00e054]">boxd.it</span>
              <span className="text-[#40bcf4]">/9eI9r</span>
            </a>
          </p>
          <p>Eliott</p>
          <button className="thanks-btn" onClick={createHeartAvalanche}>
            🫶
          </button>
        </div>
      </section>

      <YouTubeModal videoId={selectedVideoId} onClose={handleModalClose} />
      <footer className="oscars-footer">
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
