import CloudflareTurnstile from './cloudflare-turnstile'

interface TurnstileWrapperProps {
  onVerify: (token: string) => void
  onError: () => void
  onExpire: () => void
}

export default function TurnstileWrapper(props: TurnstileWrapperProps) {
  const sitekey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"

  return <CloudflareTurnstile {...props} sitekey={sitekey} />
}