'use client';
import { useState, useEffect, useRef } from 'react';
import './Presentation.css';
import oscarsDataJson from './oscars-data.json';

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
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  // Use the imported data
  const oscarsData: OscarsData = oscarsDataJson;
  const { year, categories } = oscarsData;

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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
    setHighlightedWinners((prev) => ({
      ...prev,
      [categoryName]: true,
    }));
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
    return ['Wicked', 'A Real Pain', 'The Apprentice'].includes(film);
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

            <div className="nominees-container">
              {category.nominees.map((nominee, index) => (
                <div
                  key={index}
                  className={`nominee-card ${
                    isWinner(category.name, nominee) ? 'winner-card' : ''
                  } ${isNotSeen(nominee.film) ? 'not-seen-card' : ''}`}
                >
                  <div className="nominee-title">{getNomineeTitle(nominee)}</div>
                  <div className="nominee-description">{getNomineeDescription(nominee)}</div>
                  {isNotSeen(nominee.film) && <div className="not-seen-indicator">NOT SEEN</div>}
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
          </div>
        </section>
      ))}

      <footer className="oscars-footer">
        <p>© {year} Ma Présentation des Oscars</p>
      </footer>
    </div>
  );
};
