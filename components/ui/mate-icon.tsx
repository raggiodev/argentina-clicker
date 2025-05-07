import type { SVGProps } from "react"

export function Mate(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 6.5c-.3-2.58-2.24-4.5-4.75-4.5-1.6 0-3 .83-3.87 2.06" />
      <path d="M12 2v2" />
      <path d="M14 22H9c0-3.87 3.13-7 7-7h1c0 3.87-3.13 7-7 7Z" />
      <path d="M13.83 17A8.09 8.09 0 0 1 12 15" />
      <path d="M7 8c2.76 0 5 2.24 5 5H2c0-2.76 2.24-5 5-5Z" />
      <path d="M7 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3Z" />
    </svg>
  )
}
