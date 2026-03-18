import { useEffect, useState } from 'react'
import creatorPhoto from '../assets/creator-photo.jpg'
import { GoogleSignInButton } from '../features/auth/components/GoogleSignInButton'
import { signInWithGoogle } from '../features/auth/services/authService'
import './OnboardingPage.css'

const SPLASH_DURATION_MS = 2000

const onboardingSlides = [
  {
    heroClassName: 'onboarding-page__hero onboarding-page__hero--safefree',
    title: 'Safe. Ad-Free.\nJust for Your Child.',
    subtitle:
      "No ads, no random recommendations, no distractions. Only curated Choti Ki Duniya content — exactly what your child loves.",
    content: <SafeAdFreeHero />,
  },
  {
    heroClassName: 'onboarding-page__hero onboarding-page__hero--exclusive',
    title: 'Exclusive Videos,\nOnly on the App.',
    subtitle: "Some rhymes and stories are made exclusively for app members — you won't find them anywhere on YouTube.",
    content: <ExclusiveHero />,
  },
  {
    heroClassName: 'onboarding-page__hero onboarding-page__hero--social',
    title: 'Trusted by\n7 Lakh+ Families. ❤️',
    subtitle:
      'Join thousands of parents across India who trust Choti Ki Duniya for safe, joyful learning for their little ones.',
    content: <SocialProofHero />,
  },
] as const

export function OnboardingPage() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [authError, setAuthError] = useState<string | undefined>(undefined)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    function handleOnline() {
      setIsOffline(false)
    }
    function handleOffline() {
      setIsOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (isOffline || currentStep !== 0) return undefined
    const timeoutId = window.setTimeout(() => setCurrentStep(1), SPLASH_DURATION_MS)
    return () => window.clearTimeout(timeoutId)
  }, [currentStep, isOffline])

  async function handleSignIn() {
    setAuthError(undefined)
    await signInWithGoogle()
  }

  function handleSignInWithError() {
    return handleSignIn().catch((err: { code?: string }) => {
      if (err.code === 'auth/popup-closed-by-user') return
      setAuthError('Sign in failed. Please try again.')
    })
  }

  function handleRetry() {
    if (!navigator.onLine) return
    setIsOffline(false)
  }

  function goToStep(step: number) {
    setCurrentStep(step)
  }

  function skipToSignIn() {
    setCurrentStep(onboardingSlides.length + 1)
  }

  if (isOffline) {
    return (
      <div className="onboarding-page onboarding-page--offline" data-testid="offline-screen">
        <div className="onboarding-page__offline-card">
          <div className="onboarding-page__offline-icon">📶</div>
          <p className="onboarding-page__offline-title">Check your connection</p>
          <p className="onboarding-page__offline-copy">
            Reconnect to continue setting up your child&apos;s safe viewing space.
          </p>
          <button className="onboarding-page__primary-button onboarding-page__retry-button" onClick={handleRetry}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="onboarding-page"
      data-testid="sign-in-screen"
      data-onboarding-step={currentStep === 0 ? 'splash' : currentStep === 4 ? 'sign-in' : `slide-${currentStep}`}
    >
      {currentStep === 0 ? <SplashScreen /> : null}
      {currentStep > 0 && currentStep <= onboardingSlides.length ? (
        <OnboardingSlide
          activeIndex={currentStep - 1}
          onNext={() => goToStep(currentStep + 1)}
          onSkip={skipToSignIn}
        />
      ) : null}
      {currentStep === onboardingSlides.length + 1 ? (
        <SignInScreen authError={authError} onSignIn={handleSignInWithError} />
      ) : null}
    </div>
  )
}

function SplashScreen() {
  return (
    <section className="onboarding-page__panel onboarding-page__panel--splash" data-testid="splash-screen">
      <BlobBackground fullHeight />
      <div className="onboarding-page__splash-content">
        <div className="onboarding-page__splash-creator-ring">
          <img src={creatorPhoto} alt="Creator photo" className="onboarding-page__creator-photo" />
        </div>
        <h1 className="onboarding-page__brand onboarding-page__brand--stacked">
          <span className="onboarding-page__brand-line">Choti Ki</span>
          <span className="onboarding-page__brand-line onboarding-page__brand-line--gold">Duniya</span>
        </h1>
        <p className="onboarding-page__brand-copy">Khelo Aur Seekho ✨</p>
        <div className="onboarding-page__loading-dots" aria-hidden="true">
          <span className="onboarding-page__loading-dot" />
          <span className="onboarding-page__loading-dot" />
          <span className="onboarding-page__loading-dot" />
        </div>
      </div>
    </section>
  )
}

function OnboardingSlide({
  activeIndex,
  onNext,
  onSkip,
}: {
  activeIndex: number
  onNext: () => void
  onSkip: () => void
}) {
  const slide = onboardingSlides[activeIndex]
  const isLast = activeIndex === onboardingSlides.length - 1

  return (
    <section className="onboarding-page__panel onboarding-page__panel--slide" data-testid={`onboarding-slide-${activeIndex + 1}`}>
      <div className={slide.heroClassName}>{slide.content}</div>
      <div className="onboarding-page__slide-body">
        <div className="onboarding-page__progress">
          {onboardingSlides.map((_, index) => (
            <span
              key={index}
              className={`onboarding-page__progress-dot${index === activeIndex ? ' onboarding-page__progress-dot--active' : ''}`}
            />
          ))}
        </div>
        <h2 className="onboarding-page__title">{slide.title}</h2>
        <p className="onboarding-page__subtitle">{slide.subtitle}</p>
        <div className={`onboarding-page__slide-footer${isLast ? ' onboarding-page__slide-footer--stacked' : ''}`}>
          {isLast ? (
            <>
              <button className="onboarding-page__primary-button" onClick={onSkip}>
                Get Started 🚀
              </button>
              <button className="onboarding-page__skip-button onboarding-page__skip-button--full" onClick={onSkip}>
                I&apos;ll explore first
              </button>
            </>
          ) : (
            <>
              <button className="onboarding-page__skip-button" onClick={onSkip}>
                Skip
              </button>
              <button className="onboarding-page__primary-button onboarding-page__primary-button--compact" onClick={onNext}>
                Next →
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

function SignInScreen({
  authError,
  onSignIn,
}: {
  authError?: string
  onSignIn: () => Promise<void>
}) {
  return (
    <section className="onboarding-page__panel onboarding-page__panel--signin" data-testid="sign-in-step">
      <BlobBackground fullHeight />
      <div className="onboarding-page__signin-content">
        <div className="onboarding-page__creator-ring">
          <img src={creatorPhoto} alt="Creator photo" data-testid="creator-photo" className="onboarding-page__creator-photo" />
        </div>
        <div className="onboarding-page__gold-badge">Khelo Aur Seekho ✨</div>
        <h1 className="onboarding-page__brand onboarding-page__brand--signin" data-testid="app-name">
          <span className="onboarding-page__brand-line">Choti Ki</span>
          <span className="onboarding-page__brand-line onboarding-page__brand-line--gold">Duniya</span>
        </h1>
        <p className="onboarding-page__signin-tagline">Your child&apos;s safe viewing world</p>
        <TrainIllustration />
        <div className="onboarding-page__signin-card">
          <h2 className="onboarding-page__signin-title">Welcome! 👋</h2>
          <p className="onboarding-page__signin-subtitle">
            Sign in to give your child a safe, joyful viewing experience
          </p>
          <GoogleSignInButton onSignIn={onSignIn} error={authError} />
        </div>
      </div>
    </section>
  )
}

function BlobBackground({ fullHeight = false }: { fullHeight?: boolean }) {
  return (
    <div className={`onboarding-page__blob-bg${fullHeight ? ' onboarding-page__blob-bg--full' : ''}`} aria-hidden="true">
      <span className="onboarding-page__blob onboarding-page__blob--one" />
      <span className="onboarding-page__blob onboarding-page__blob--two" />
      <span className="onboarding-page__blob onboarding-page__blob--three" />
    </div>
  )
}

function SafeAdFreeHero() {
  const items = [
    ['No ads. Ever.', 'Your child watches without interruption'],
    ['Only CKD videos', 'No random channels or suggestions'],
    ['Safe by design', 'No external links, no unknown content'],
  ]
  return (
    <div className="onboarding-page__hero-stack">
      <div className="onboarding-page__hero-top-emoji">👧🎵</div>
      {items.map(([title, subtitle]) => (
        <div key={title} className="onboarding-page__check-card">
          <div className="onboarding-page__check-icon">✅</div>
          <div>
            <p className="onboarding-page__check-title">{title}</p>
            <p className="onboarding-page__check-subtitle">{subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function ExclusiveHero() {
  return (
    <div className="onboarding-page__compare-hero">
      <p className="onboarding-page__compare-caption">Where you watch matters</p>
      <div className="onboarding-page__compare-row">
        <div className="onboarding-page__compare-card">
          <div className="onboarding-page__compare-icon">📺</div>
          <p className="onboarding-page__compare-label">YouTube</p>
          <p className="onboarding-page__compare-negative">✗ Ads appear</p>
          <p className="onboarding-page__compare-negative">✗ Other channels</p>
          <p className="onboarding-page__compare-negative">✗ All videos</p>
        </div>
        <div className="onboarding-page__compare-vs">VS</div>
        <div className="onboarding-page__compare-card onboarding-page__compare-card--ckd">
          <div className="onboarding-page__compare-icon">✨</div>
          <p className="onboarding-page__compare-label onboarding-page__compare-label--light">CKD App</p>
          <p className="onboarding-page__compare-positive">✓ Zero ads</p>
          <p className="onboarding-page__compare-positive">✓ Only CKD</p>
          <p className="onboarding-page__compare-star">★ Exclusives</p>
        </div>
      </div>
    </div>
  )
}

function SocialProofHero() {
  return (
    <div className="onboarding-page__social-hero">
      <div className="onboarding-page__social-photo-ring">
        <img src={creatorPhoto} alt="Creator photo" className="onboarding-page__creator-photo" />
      </div>
      <div className="onboarding-page__social-chips">
        <div className="onboarding-page__social-chip">
          <div className="onboarding-page__social-icon">❤️</div>
          <div className="onboarding-page__social-value">7 Lakh+</div>
          <div className="onboarding-page__social-label">Subscribers</div>
        </div>
        <div className="onboarding-page__social-chip">
          <div className="onboarding-page__social-icon">▶️</div>
          <div className="onboarding-page__social-value onboarding-page__social-value--coral">1 Billion+</div>
          <div className="onboarding-page__social-label">Views</div>
        </div>
      </div>
    </div>
  )
}

function TrainIllustration() {
  return (
    <div className="onboarding-page__train" aria-hidden="true">
      <div className="onboarding-page__track" />
      <div className="onboarding-page__train-body">
        <div className="onboarding-page__train-car onboarding-page__train-car--engine">
          <span className="onboarding-page__train-engine">🚂</span>
          <span className="onboarding-page__wheel onboarding-page__wheel--left" />
          <span className="onboarding-page__wheel onboarding-page__wheel--right" />
        </div>
        <div className="onboarding-page__train-car">
          <span className="onboarding-page__train-text">CHOTI</span>
          <span className="onboarding-page__wheel onboarding-page__wheel--left" />
          <span className="onboarding-page__wheel onboarding-page__wheel--right" />
        </div>
        <div className="onboarding-page__train-car">
          <span className="onboarding-page__train-text">KI</span>
          <span className="onboarding-page__wheel onboarding-page__wheel--left" />
          <span className="onboarding-page__wheel onboarding-page__wheel--right" />
        </div>
        <div className="onboarding-page__train-car">
          <span className="onboarding-page__train-text">DUNIYA</span>
          <span className="onboarding-page__wheel onboarding-page__wheel--left" />
          <span className="onboarding-page__wheel onboarding-page__wheel--right" />
        </div>
      </div>
    </div>
  )
}
