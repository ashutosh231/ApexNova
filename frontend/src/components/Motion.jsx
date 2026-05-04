import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const easing = [0.16, 1, 0.3, 1]

export function Reveal({
  as,
  delay = 0,
  y = 18,
  duration = 0.65,
  once = true,
  amount = 0.2,
  className,
  style,
  children,
  ...rest
}) {
  const reduced = useReducedMotion()
  const Comp = as ?? motion.div

  if (reduced) {
    return (
      <Comp className={className} style={style} {...rest}>
        {children}
      </Comp>
    )
  }

  return (
    <Comp
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration, ease: easing, delay }}
      {...rest}
    >
      {children}
    </Comp>
  )
}

export function Fade({
  as,
  delay = 0,
  duration = 0.6,
  once = true,
  amount = 0.2,
  className,
  style,
  children,
  ...rest
}) {
  const reduced = useReducedMotion()
  const Comp = as ?? motion.div

  if (reduced) {
    return (
      <Comp className={className} style={style} {...rest}>
        {children}
      </Comp>
    )
  }

  return (
    <Comp
      className={className}
      style={style}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once, amount }}
      transition={{ duration, ease: easing, delay }}
      {...rest}
    >
      {children}
    </Comp>
  )
}

