import { Link } from 'react-router-dom';
import { User, Heart, Shield, Clock, Users, BookOpen } from 'lucide-react';
import { useContentStore } from '../store/contentStore';

// Default landing page content
const defaultLandingPage = {
  heroTitle: 'Welcome to RAGE4INFO',
  heroSubtitle: 'Your comprehensive resource for caregiving information and support',
  caregiverCard: {
    title: 'INFO4 Caregivers',
    description: 'Access resources, training materials, and support tools designed specifically for professional and family caregivers.',
    buttonText: 'Explore Caregiver Resources'
  },
  careRecipientCard: {
    title: 'INFO4 People with Disabilities',
    description: 'Find information about care options, support services, and resources to help maintain independence and quality of life.',
    buttonText: 'Explore Care Recipient Resources'
  }
};

export default function HomePage() {
  const { content } = useContentStore();

  // Use store values with fallbacks to defaults
  const landingPage = content?.landingPage || defaultLandingPage;
  const heroTitle = landingPage.heroTitle || defaultLandingPage.heroTitle;
  const heroSubtitle = landingPage.heroSubtitle || defaultLandingPage.heroSubtitle;
  const caregiverCard = { ...defaultLandingPage.caregiverCard, ...landingPage.caregiverCard };
  const careRecipientCard = { ...defaultLandingPage.careRecipientCard, ...landingPage.careRecipientCard };

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1 className="hero-title">{heroTitle}</h1>
        <p className="hero-subtitle">{heroSubtitle}</p>
      </div>

      <div className="role-cards">
        <Link to="/caregiver" className="role-card caregiver-card">
          <div className="role-card-icon">
            <User size={48} />
          </div>
          <h2 className="role-card-title">{caregiverCard.title}</h2>
          <p className="role-card-description">{caregiverCard.description}</p>
          <div className="role-card-features">
            <div className="feature-item">
              <Shield size={20} />
              <span>Professional Development</span>
            </div>
            <div className="feature-item">
              <Clock size={20} />
              <span>Time Management Tools</span>
            </div>
            <div className="feature-item">
              <BookOpen size={20} />
              <span>Training Resources</span>
            </div>
          </div>
          <button className="btn btn-primary">
            {caregiverCard.buttonText}
          </button>
        </Link>

        <Link to="/care-recipient" className="role-card recipient-card">
          <div className="role-card-icon">
            <Heart size={48} />
          </div>
          <h2 className="role-card-title">{careRecipientCard.title}</h2>
          <p className="role-card-description">{careRecipientCard.description}</p>
          <div className="role-card-features">
            <div className="feature-item">
              <Users size={20} />
              <span>Support Networks</span>
            </div>
            <div className="feature-item">
              <Shield size={20} />
              <span>Safety Resources</span>
            </div>
            <div className="feature-item">
              <Heart size={20} />
              <span>Wellness Programs</span>
            </div>
          </div>
          <button className="btn btn-primary">
            {careRecipientCard.buttonText}
          </button>
        </Link>
      </div>

      <style>{`
        .home-page {
          max-width: 1024px;
          width: 100%;
          margin: 0 auto;
        }

        .hero-section {
          text-align: center;
          padding: var(--spacing-2xl) 0;
          margin-bottom: var(--spacing-2xl);
        }

        .hero-title {
          font-size: 3rem;
          background: var(--brand-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: var(--spacing-lg);
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: var(--text-secondary);
        }

        .role-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: var(--spacing-xl);
          padding: var(--spacing-xl);
        }

        .role-card {
          background: var(--bg-primary);
          border: 2px solid var(--border-color);
          border-radius: var(--radius-xl);
          padding: var(--spacing-xl);
          text-decoration: none;
          color: inherit;
          transition: all var(--transition-base);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .role-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: var(--brand-gradient);
        }

        .role-card:hover {
          transform: translateY(-8px);
          box-shadow: var(--shadow-xl);
          border-color: var(--brand-primary);
        }

        .caregiver-card::before {
          background: linear-gradient(90deg, #667eea, #764ba2);
        }

        .recipient-card::before {
          background: linear-gradient(90deg, #f093fb, #f5576c);
        }

        .role-card-icon {
          width: 100px;
          height: 100px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: var(--spacing-lg);
          color: white;
        }

        .caregiver-card .role-card-icon {
          background: linear-gradient(135deg, #667eea, #764ba2);
        }

        .recipient-card .role-card-icon {
          background: linear-gradient(135deg, #f093fb, #f5576c);
        }

        .role-card-title {
          font-size: 1.75rem;
          margin-bottom: var(--spacing-md);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Ensure desktop titles fit on one line */
        @media (min-width: 901px) {
          .role-card-title {
            font-size: 1.5rem;
          }
        }

        .role-card-description {
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: var(--spacing-lg);
        }

        .role-card-features {
          width: 100%;
          margin: var(--spacing-lg) 0;
          padding: var(--spacing-lg) 0;
          border-top: 1px solid var(--border-color);
          border-bottom: 1px solid var(--border-color);
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-md);
          color: var(--text-secondary);
        }

        .feature-item:last-child {
          margin-bottom: 0;
        }

        @media (max-width: 900px) {
          .role-cards {
            grid-template-columns: 1fr;
            padding: var(--spacing-lg);
          }

          .hero-title {
            font-size: 2rem;
          }

          .role-card-title {
            white-space: normal;
            font-size: 1.35rem;
            line-height: 1.3;
          }
        }
      `}</style>
    </div>
  );
}