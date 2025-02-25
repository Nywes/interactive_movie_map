'use client';
import { useWindowScroll } from 'react-use';
import { useState, useEffect, useRef } from 'react';
import './Presentation.css';

// Définir les types pour les nominés et les sections
type Nominee = {
  name: string;
  movie?: string;
};

type Section = {
  title: string;
  nominees: Nominee[];
  winner: Nominee;
};

export const Presentation = () => {
  const { y: scrollY } = useWindowScroll();
  const [activeSection, setActiveSection] = useState(0);
  const [highlightedWinners, setHighlightedWinners] = useState<{ [key: string]: boolean }>({});
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  const sections: Section[] = [
    {
      title: 'Best Actor',
      nominees: [
        { name: 'Timothée Chalamet', movie: 'A Complete Unknown' },
        { name: 'Austin Butler', movie: 'Elvis' },
        { name: 'Brendan Fraser', movie: 'The Whale' },
        { name: 'Daniel Day-Lewis', movie: 'Phantom Thread' },
        { name: 'Gary Oldman', movie: 'Darkest Hour' },
      ],
      winner: { name: 'Brendan Fraser', movie: 'The Whale' },
    },
    {
      title: 'Best Director',
      nominees: [
        { name: 'Martin Scorsese', movie: 'The Irishman' },
        { name: 'Steven Spielberg', movie: 'The Fabelmans' },
        { name: 'Damien Chazelle', movie: 'Babylon' },
        { name: 'Quentin Tarantino', movie: 'Once Upon a Time in Hollywood' },
        { name: 'Christopher Nolan', movie: 'Oppenheimer' },
      ],
      winner: { name: 'Christopher Nolan', movie: 'Oppenheimer' },
    },
    {
      title: 'Best Picture',
      nominees: [
        { name: 'The Banshees of Inisherin' },
        { name: 'Babylon' },
        { name: 'The Fabelmans' },
        { name: 'The Power of the Dog' },
        { name: 'The Whale' },
      ],
      winner: { name: 'The Fabelmans' },
    },
  ];

  // Effet pour changer de section en fonction du défilement
  useEffect(() => {
    const sectionHeight = window.innerHeight;
    const currentSection = Math.floor(scrollY / sectionHeight);
    setActiveSection(Math.min(currentSection, sections.length));

    // Add fade effect to intro section background
    const introSection = document.querySelector('.intro-section');
    if (introSection) {
      if (scrollY > window.innerHeight * 0.3) {
        introSection.classList.add('fade-out');
      } else {
        introSection.classList.remove('fade-out');
      }
    }
  }, [scrollY, sections.length]);

  // Fonction pour naviguer vers une section spécifique
  const navigateToSection = (index: number) => {
    if (sectionRefs.current[index]) {
      sectionRefs.current[index]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  const revealWinner = (sectionTitle: string) => {
    setHighlightedWinners((prev) => ({
      ...prev,
      [sectionTitle]: true,
    }));
  };

  const isWinner = (sectionTitle: string, nominee: Nominee) => {
    const section = sections.find((s) => s.title === sectionTitle);
    if (!section) return false;

    return section.winner.name === nominee.name && highlightedWinners[sectionTitle];
  };

  // Fonction pour assigner les refs correctement
  const assignRef = (index: number) => (el: HTMLElement | null) => {
    sectionRefs.current[index] = el;
  };

  return (
    <div className="oscars-presentation">
      <div className="intro-section" ref={assignRef(0)}>
        <div className="flex flex-col items-center justify-center">
          <h1>Ma Présentation des</h1>
          <div className="oscars-text-logo" />
        </div>
        <p className="intro-text">
          Bienvenue dans ma présentation personnelle des Oscars. Découvrez mes nominations et mes
          choix de gagnants pour chaque catégorie. Faites défiler pour explorer les différentes
          catégories.
        </p>
        <div className="scroll-indicator" onClick={() => navigateToSection(1)}>
          <span>Défiler</span>
          <div className="scroll-arrow"></div>
        </div>
      </div>

      {sections.map((section, index) => (
        <section
          key={section.title}
          className={`category-section ${activeSection === index + 1 ? 'active' : ''}`}
          id={`section-${index + 1}`}
          ref={assignRef(index + 1)}
        >
          <div className="category-content">
            <h2 className="category-title">{section.title}</h2>

            <div className="nominees-container">
              {section.nominees.map((nominee) => (
                <div
                  key={nominee.name}
                  className={`nominee-card ${
                    isWinner(section.title, nominee) ? 'winner-card' : ''
                  }`}
                >
                  <div className="nominee-name">{nominee.name}</div>
                  {nominee.movie && <div className="nominee-movie">{nominee.movie}</div>}
                </div>
              ))}
            </div>

            <button className="reveal-winner-btn" onClick={() => revealWinner(section.title)}>
              Révéler mon choix
            </button>
          </div>
        </section>
      ))}

      <footer className="oscars-footer">
        <p>© {new Date().getFullYear()} Ma Présentation des Oscars</p>
      </footer>
    </div>
  );
};
