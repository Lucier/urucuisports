'use client'

import { useState } from 'react'
import NextImage from 'next/image'

interface FillProps {
  src: string
  alt: string
  className?: string
  sizes?: string
  priority?: boolean
  width?: never
  height?: never
}

interface SizedProps {
  src: string
  alt: string
  className?: string
  width: number
  height: number
  priority?: boolean
  sizes?: never
}

type Props = FillProps | SizedProps

export function SafeImage(props: Props) {
  const [hidden, setHidden] = useState(false)
  if (hidden) return null

  if ('width' in props && props.width !== undefined) {
    const { src, alt, className, width, height, priority = false } = props
    return (
      <NextImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        priority={priority}
        onError={() => setHidden(true)}
      />
    )
  }

  const { src, alt, className, sizes = '100vw', priority = false } = props
  return (
    <NextImage
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setHidden(true)}
    />
  )
}
