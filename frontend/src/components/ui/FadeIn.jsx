import { useState, useEffect, useRef } from 'react'

// Fade in wrapper component
function FadeIn({ 
  children, 
  delay = 0, 
  duration = 500, 
  direction = 'up',
  className = '',
  show = true 
}) {
  const [isVisible, setIsVisible] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    
    if (show) {
      timerRef.current = setTimeout(() => setIsVisible(true), delay)
    } else {
      timerRef.current = setTimeout(() => setIsVisible(false), 0)
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [show, delay])

  const directionStyles = {
    up: 'translate-y-4',
    down: '-translate-y-4',
    left: 'translate-x-4',
    right: '-translate-x-4',
    none: '',
  }

  return (
    <div
      className={`transition-all ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translate(0, 0)' : undefined,
      }}
      data-direction={!isVisible ? directionStyles[direction] : ''}
    >
      <div
        className={`transition-transform`}
        style={{
          transitionDuration: `${duration}ms`,
          transform: isVisible ? 'translateY(0) translateX(0)' : 
            direction === 'up' ? 'translateY(16px)' :
            direction === 'down' ? 'translateY(-16px)' :
            direction === 'left' ? 'translateX(16px)' :
            direction === 'right' ? 'translateX(-16px)' : 'none'
        }}
      >
        {children}
      </div>
    </div>
  )
}

// Staggered fade in for lists
function FadeInStagger({ 
  children, 
  staggerDelay = 100, 
  initialDelay = 0,
  duration = 500,
  direction = 'up',
  show = true 
}) {
  return (
    <>
      {Array.isArray(children) ? children.map((child, index) => (
        <FadeIn
          key={index}
          delay={initialDelay + (index * staggerDelay)}
          duration={duration}
          direction={direction}
          show={show}
        >
          {child}
        </FadeIn>
      )) : (
        <FadeIn delay={initialDelay} duration={duration} direction={direction} show={show}>
          {children}
        </FadeIn>
      )}
    </>
  )
}

// Scale fade in
function ScaleFadeIn({ 
  children, 
  delay = 0, 
  duration = 400, 
  className = '',
  show = true 
}) {
  const [isVisible, setIsVisible] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    
    if (show) {
      timerRef.current = setTimeout(() => setIsVisible(true), delay)
    } else {
      timerRef.current = setTimeout(() => setIsVisible(false), 0)
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [show, delay])

  return (
    <div
      className={`transition-all ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.95)',
      }}
    >
      {children}
    </div>
  )
}

export { FadeIn, FadeInStagger, ScaleFadeIn }
