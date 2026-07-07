import React from 'react'

interface BrandLogoProps {
  className?: string
  size?: number
  imageSrc?: string
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 32,
  imageSrc = './icon.webp'
}) => {
  if (imageSrc) {
    return (
      <img
        src={imageSrc}
        alt="Luna Logo"
        width={size}
        height={size}
        className={className}
        style={{ objectFit: 'contain' }}
      />
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 3a9 9 0 1 0 9 9 9.75 9.75 0 0 0-.25-2 7.5 7.5 0 0 1-7.25-7.25A9.75 9.75 0 0 0 12 3z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.5"
      />
    </svg>
  )
}

export default BrandLogo
