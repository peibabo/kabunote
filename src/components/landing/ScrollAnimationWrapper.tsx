'use client'

import { useEffect, useRef, type ReactNode } from 'react'

type Direction = 'up' | 'left' | 'right'

interface ScrollAnimationWrapperProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: Direction
}

const directionClass: Record<Direction, string> = {
  up: 'scroll-hidden',
  left: 'scroll-hidden-left',
  right: 'scroll-hidden-right',
}

export default function ScrollAnimationWrapper({
  children,
  className = '',
  delay = 0,
  direction = 'up',
}: ScrollAnimationWrapperProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            el.classList.add('scroll-visible')
          }, delay)
          observer.unobserve(el)
        }
      },
      { threshold: 0.15 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return (
    <div ref={ref} className={`${directionClass[direction]} ${className}`}>
      {children}
    </div>
  )
}
