declare module 'web-push' {
  export interface PushSubscription {
    endpoint: string
    keys: { p256dh: string; auth: string }
  }
  const webpush: {
    setVapidDetails: (contact: string, publicKey: string, privateKey: string) => void
    sendNotification: (subscription: PushSubscription, payload?: string) => Promise<any>
  }
  export default webpush
}

declare module 'nodemailer' {
  interface Transporter {
    sendMail: (opts: any) => Promise<any>
  }
  function createTransport(opts: any): Transporter
  export { createTransport }
  const _default: any
  export default _default
}
