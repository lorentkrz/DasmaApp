import { Heart, Sparkles, Calendar, MapPin, Clock, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Playfair_Display, Great_Vibes, Cormorant_Garamond } from 'next/font/google'

export const dynamic = "force-static"

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400','600','700'] })
const greatVibes = Great_Vibes({ subsets: ['latin'], weight: '400' })
const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400','700'] })

function Wreath({ wedding, guest, groupMembers }: any) {
  const dateObj = new Date(wedding.wedding_date)
  const month = dateObj.toLocaleDateString('sq-AL', { month: 'long' })
  const day = dateObj.toLocaleDateString('sq-AL', { day: '2-digit' })
  const weekday = dateObj.toLocaleDateString('sq-AL', { weekday: 'long' })
  const time = wedding.ceremony_time || '19:00'
  const venue = wedding.venue || 'Salla "Elegance"'
  const isGroup = (groupMembers && groupMembers.length > 0) || guest.plus_one
  return (
    <div className="min-h-screen bg-[#faf9f7] text-stone-700">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="relative overflow-hidden bg-white rounded-[32px] shadow-sm border border-stone-100 p-8 sm:p-12">
          <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{backgroundImage:'radial-gradient(#000 1px, transparent 1px)', backgroundSize:'6px 6px'}} />
          <div className="pointer-events-none absolute inset-0">
            <svg className="absolute -top-8 -left-8 w-44 h-44 opacity-50" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 78 C28 58, 44 44, 66 34" stroke="#86a77a" strokeWidth="2.2" fill="none"/>
              <circle cx="68" cy="32" r="3.2" fill="#efb6bf" />
              <circle cx="60" cy="38" r="2.6" fill="#f5c8cf" />
            </svg>
            <svg className="absolute -bottom-8 -right-8 w-48 h-48 opacity-50 rotate-180" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 78 C28 58, 44 44, 66 34" stroke="#86a77a" strokeWidth="2.2" fill="none"/>
              <circle cx="68" cy="32" r="3.2" fill="#efb6bf" />
              <circle cx="60" cy="38" r="2.6" fill="#f5c8cf" />
            </svg>
          </div>
          {/* Interlocking gold rings with leafy wreath accents (realistic rings, greenery outside) */}
          <div className="flex justify-center mb-10">
            <div className="relative w-[340px] h-[180px]">
              {/* Rings (SVG gradient + highlight + shadow) */}
              <svg className="absolute inset-0" width="340" height="180" viewBox="0 0 340 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="goldGradPrev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fde7a5"/>
                    <stop offset="45%" stopColor="#e2b659"/>
                    <stop offset="100%" stopColor="#b07b2a"/>
                  </linearGradient>
                  <radialGradient id="specPrev" cx="0.5" cy="0.2" r="0.7">
                    <stop offset="0%" stopColor="#fff8d6" stopOpacity="0.9"/>
                    <stop offset="100%" stopColor="#fff8d6" stopOpacity="0"/>
                  </radialGradient>
                  <filter id="ringShadowPrev" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="1.2" stdDeviation="1.6" floodColor="#8f6a2a" floodOpacity="0.25"/>
                  </filter>
                </defs>
                <circle cx="95" cy="90" r="82" stroke="url(#goldGradPrev)" strokeWidth="4.5" fill="none" filter="url(#ringShadowPrev)" strokeLinecap="round"/>
                <circle cx="245" cy="90" r="82" stroke="url(#goldGradPrev)" strokeWidth="4.5" fill="none" filter="url(#ringShadowPrev)" strokeLinecap="round"/>
                <path d="M310,86 A82,82 0 0 0 245,8" stroke="url(#specPrev)" strokeWidth="3" fill="none"/>
              </svg>

              {/* Left wreath outside */}
              <svg className="absolute left-0 top-0 w-[180px] h-[180px]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <mask id="outsideLeftPrev" maskUnits="userSpaceOnUse">
                    <rect x="0" y="0" width="100" height="100" fill="white"/>
                    <circle cx="50" cy="50" r="44" fill="black"/>
                  </mask>
                </defs>
                <g mask="url(#outsideLeftPrev)">
                  <path d="M10 80 C28 54, 44 40, 70 32" stroke="#7fa36f" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
                  <path d="M12 70 C30 50, 48 38, 72 30" stroke="#7fa36f" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                  <path d="M22 70 q4 -6 10 -6 q-6 6 -10 12" fill="#88b07a"/>
                  <path d="M36 56 q5 -6 11 -5 q-6 6 -11 11" fill="#88b07a"/>
                  <path d="M50 46 q5 -6 11 -5 q-6 6 -11 11" fill="#88b07a"/>
                  <circle cx="74" cy="28" r="2.6" fill="#efb6bf" />
                  <circle cx="64" cy="36" r="2.2" fill="#f5c8cf" />
                  <circle cx="54" cy="44" r="2" fill="#efb6bf" />
                </g>
              </svg>

              {/* Right wreath outside */}
              <svg className="absolute right-0 top-0 w-[180px] h-[180px]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <mask id="outsideRightPrev" maskUnits="userSpaceOnUse">
                    <rect x="0" y="0" width="100" height="100" fill="white"/>
                    <circle cx="50" cy="50" r="44" fill="black"/>
                  </mask>
                </defs>
                <g mask="url(#outsideRightPrev)">
                  <path d="M90 20 C70 46, 56 58, 30 68" stroke="#7fa36f" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
                  <path d="M86 30 C68 50, 52 62, 28 70" stroke="#7fa36f" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                  <path d="M78 34 q-6 6 -6 12 q6 -4 12 -10" fill="#88b07a"/>
                  <path d="M64 50 q-6 6 -6 12 q6 -4 12 -10" fill="#88b07a"/>
                  <path d="M48 60 q-6 6 -6 12 q6 -4 12 -10" fill="#88b07a"/>
                  <circle cx="26" cy="72" r="2.6" fill="#efb6bf" />
                  <circle cx="36" cy="64" r="2.2" fill="#f5c8cf" />
                  <circle cx="46" cy="56" r="2" fill="#efb6bf" />
                </g>
              </svg>

              {/* Ampersand in overlap */}
              <div className={`${cormorant.className} absolute inset-0 flex items-center justify-center text-stone-600 text-2xl`}>&amp;</div>
            </div>
          </div>
          <p className={`${playfair.className} text-center text-[12px] tracking-[0.35em] text-stone-600`}>SAVE THE DATE</p>
          <p className={`${playfair.className} text-center text-[11px] tracking-[0.25em] text-stone-500 mt-1`}>THE WEDDING OF</p>
          <h1 className={`${greatVibes.className} text-center text-5xl sm:text-6xl text-emerald-800 mt-3`}>{wedding.bride_name} &amp; {wedding.groom_name}</h1>
          <div className="mt-6 flex flex-col items-center">
            <span className={`${cormorant.className} inline-block px-4 py-1 rounded-md bg-emerald-50 text-emerald-800 text-sm font-medium uppercase tracking-wider`}>{month}</span>
            <div className="mt-2 mx-auto w-full sm:w-4/5 max-w-md grid grid-cols-3 items-stretch text-center rounded-xl overflow-hidden border border-emerald-100">
              <div className={`${cormorant.className} px-3 py-2 bg-emerald-50 text-emerald-800 font-semibold uppercase text-xs`}>{weekday}</div>
              <div className={`${cormorant.className} px-3 py-2 bg-white text-emerald-800 font-extrabold text-3xl border-x border-emerald-100`}>{day}</div>
              <div className={`${cormorant.className} px-3 py-2 bg-emerald-50 text-emerald-800 font-semibold uppercase text-xs`}>{time}</div>
            </div>
          </div>
          <p className={`${playfair.className} text-center text-sm text-stone-600 mt-4`}>{venue}</p>
          {/* Invitee names display */}
          <div className="text-center mt-5">
            <p className={`${cormorant.className} text-[11px] tracking-[0.25em] text-stone-500`}>INVITATION FOR</p>
            <p className={`${playfair.className} text-stone-700 text-base mt-1`}>
              {guest.first_name} {guest.last_name}{guest.plus_one ? ' +1' : ''}
              {isGroup && (
                <span className="block text-sm text-stone-500 mt-1">Group: {groupMembers.map((m:any)=> `${m.first_name} ${m.last_name}`).join(', ')}</span>
              )}
            </p>
          </div>
          <p className={`${playfair.className} text-center text-[11px] tracking-[0.25em] text-stone-400 mt-10`}>RECEPTION TO FOLLOW</p>
        </div>
      </div>
    </div>
  )
}

function Floral({ wedding, guest, groupMembers }: any) {
  return (
    <div className="min-h-screen font-serif bg-[radial-gradient(ellipse_at_top_left,rgba(253,242,248,0.9),rgba(255,255,255,0.9)),radial-gradient(ellipse_at_bottom_right,rgba(255,247,237,0.9),rgba(255,255,255,0.9))] relative overflow-hidden">
      {/* Decorative corner florals using inline SVGs */}
      <div className="pointer-events-none absolute inset-0">
        <svg className="absolute -top-6 -left-6 w-40 h-40 opacity-60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 70 C30 50, 40 40, 60 30" stroke="#9ec27d" strokeWidth="3" fill="none"/>
          <circle cx="62" cy="28" r="4" fill="#f3bebe" />
          <circle cx="54" cy="34" r="3" fill="#f7d3d3" />
        </svg>
        <svg className="absolute -bottom-6 -right-6 w-44 h-44 opacity-60 rotate-180" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 70 C30 50, 40 40, 60 30" stroke="#9ec27d" strokeWidth="3" fill="none"/>
          <circle cx="62" cy="28" r="4" fill="#f3bebe" />
          <circle cx="54" cy="34" r="3" fill="#f7d3d3" />
        </svg>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto text-center bg-white/80 backdrop-blur-sm rounded-[28px] shadow-lg p-8 sm:p-10 border border-emerald-50">
          <p className="text-gray-500 tracking-wide text-xs mb-6">Së bashku me familjet e tyre</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-emerald-800 mb-2">{wedding.bride_name} &amp; {wedding.groom_name}</h1>
          <p className="text-gray-600 text-sm mb-10">ju ftojnë në dasmën e tyre</p>

          <div className="text-emerald-800 font-bold text-lg mb-2">
            {new Date(wedding.wedding_date).toLocaleDateString('sq-AL', { year: 'numeric', month: 'long', day: 'numeric' })}
            {wedding.ceremony_time ? ` | ${wedding.ceremony_time}` : ''}
          </div>
          <div className="text-gray-700 mb-8">{wedding.venue || 'Salla "Elegance"'}</div>

          <div className="grid grid-cols-1 gap-3 mt-2">
            <Button className="w-full rounded-full py-3 px-5 bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors">Konfirmo pjesëmarrjen</Button>
            <Button variant="secondary" className="w-full rounded-full py-3 px-5 bg-amber-400 text-white font-semibold hover:bg-amber-500 transition-colors">Ndoshta</Button>
            <Button variant="destructive" className="w-full rounded-full py-3 px-5 bg-rose-400 text-white font-semibold hover:bg-rose-500 transition-colors">Nuk mundem</Button>
          </div>

          <p className="mt-10 text-[11px] text-gray-500">RSVP për: {guest.first_name} {guest.last_name}{guest.plus_one ? ' +1' : ''}</p>
          {groupMembers && groupMembers.length > 0 && (
            <p className="mt-1 text-[11px] text-gray-500">Grupi: {groupMembers.map((m: any)=> `${m.first_name} ${m.last_name}`).join(', ')}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function Classic({ wedding, guest, groupMembers }: any) {
  const isGroup = (groupMembers && groupMembers.length > 0) || guest.plus_one
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 bg-rose-200/30 rounded-full blur-xl"></div>
        <div className="absolute top-32 right-16 w-16 h-16 bg-amber-200/40 rounded-full blur-lg"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-pink-200/25 rounded-full blur-xl"></div>
        <div className="absolute bottom-32 right-1/3 w-12 h-12 bg-rose-300/35 rounded-full blur-md"></div>
      </div>
      <div className="relative z-10 container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6 md:mb-8">
            <div className="flex justify-center items-center gap-2 mb-4">
              <Heart className="h-6 w-6 md:h-8 md:w-8 text-rose-500" fill="currentColor" />
              <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-amber-500" fill="currentColor" />
              <Heart className="h-6 w-6 md:h-8 md:w-8 text-rose-500" fill="currentColor" />
            </div>
            <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Ju jeni të ftuar!
            </h1>
            <p className="text-base md:text-lg text-gray-600 font-medium px-4">
              në dasmën e {wedding.bride_name} & {wedding.groom_name}
            </p>
          </div>
          <Card className="rounded-2xl sm:rounded-3xl shadow-2xl border-0 overflow-hidden backdrop-blur-sm bg-white/95">
            <CardHeader className="relative bg-gradient-to-r from-rose-100 via-pink-50 to-amber-100 py-8 md:py-12 text-center overflow-hidden">
              <div className="relative z-10">
                <div className="flex justify-center items-center mb-4 md:mb-6">
                  <div className="relative">
                    <Heart className="h-12 w-12 md:h-16 md:w-16 text-rose-500" fill="currentColor" />
                    <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-amber-400" />
                  </div>
                </div>
                <CardTitle className="text-3xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 bg-clip-text text-transparent">
                  Ftesa Juaj e Veçantë
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 md:space-y-10 p-6 md:p-10 text-center">
              <div className="bg-gradient-to-r from-amber-50 to-rose-50 rounded-2xl p-4 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 text-center">
                  <div className="space-y-2 p-4 bg-white/50 rounded-xl">
                    <Calendar className="h-6 w-6 md:h-8 md:w-8 text-rose-500 mx-auto" />
                    <p className="font-semibold text-gray-800 text-sm md:text-base">Data</p>
                    <p className="text-gray-600 text-sm md:text-base">{new Date(wedding.wedding_date).toLocaleDateString('sq-AL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="space-y-2 p-4 bg-white/50 rounded-xl">
                    <Clock className="h-6 w-6 md:h-8 md:w-8 text-amber-500 mx-auto" />
                    <p className="font-semibold text-gray-800 text-sm md:text-base">Koha</p>
                    <p className="text-gray-600 text-sm md:text-base">{wedding.ceremony_time || '17:00'}</p>
                  </div>
                  <div className="space-y-2 p-4 bg-white/50 rounded-xl">
                    <MapPin className="h-6 w-6 md:h-8 md:w-8 text-pink-500 mx-auto" />
                    <p className="font-semibold text-gray-800 text-sm md:text-base">Vendi</p>
                    <p className="text-gray-600 text-sm md:text-base break-words">{wedding.venue || 'Salla "Elegance"'}</p>
                  </div>
                </div>
              </div>
              {isGroup && (
                <div className="space-y-6 md:space-y-8">
                  <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl p-4 md:p-6">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Users className="h-5 w-5 text-rose-500" />
                      <p className="text-base md:text-lg font-semibold text-gray-700">Kjo ftesë është për:</p>
                    </div>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <li className="bg-white/80 backdrop-blur-sm border border-rose-200/50 rounded-xl px-4 py-3 shadow-sm text-gray-700 font-medium text-sm flex items-center gap-2">
                        <Heart className="h-3 w-3 text-rose-400" fill="currentColor" />
                        {guest.first_name} {guest.last_name}
                      </li>
                      {guest.plus_one && (
                        <li className="bg-white/80 backdrop-blur-sm border border-rose-200/50 rounded-xl px-4 py-3 shadow-sm text-gray-700 font-medium text-sm flex items-center gap-2">
                          <Heart className="h-3 w-3 text-rose-400" fill="currentColor" />
                          {guest.plus_one_name || 'Shoqëruesi/ja'}
                        </li>
                      )}
                      {groupMembers?.map((m: any) => (
                        <li key={m.id} className="bg-white/80 backdrop-blur-sm border border-rose-200/50 rounded-xl px-4 py-3 shadow-sm text-gray-700 font-medium text-sm flex items-center gap-2">
                          <Heart className="h-3 w-3 text-rose-400" fill="currentColor" />
                          {m.first_name} {m.last_name}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button className="w-full rounded-2xl font-bold py-6 text-lg bg-gradient-to-r from-green-500 to-emerald-500">Po, do të vij!</Button>
                <Button variant="secondary" className="w-full rounded-2xl font-bold py-6 text-lg bg-gradient-to-r from-amber-400 to-yellow-400 text-white">Ndoshta</Button>
                <Button variant="destructive" className="w-full rounded-2xl font-bold py-6 text-lg bg-gradient-to-r from-rose-500 to-pink-500">Na vjen keq</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function InvitePreview({ searchParams }: { searchParams: { theme?: string; mode?: string } }) {
  const theme = (searchParams?.theme || '').toLowerCase()
  const mode = (searchParams?.mode || 'single').toLowerCase()

  const wedding = {
    groom_name: 'Lorent',
    bride_name: 'Albiona',
    wedding_date: new Date().toISOString(),
    ceremony_time: '19:00',
    venue: 'Evropa Deluxe',
  }

  const guest = {
    id: 'guest-1',
    first_name: 'Arben',
    last_name: 'Gashi',
    plus_one: mode === 'group',
    plus_one_name: mode === 'group' ? 'Miresia' : undefined,
  }

  const groupMembers = mode === 'group'
    ? [
        { id: 'g2', first_name: 'Blerina', last_name: 'Gashi' },
        { id: 'g3', first_name: 'Dren', last_name: 'Gashi' },
      ]
    : []

  const commonProps = { wedding, guest, groupMembers }

  if (theme === 'wreath') return <Wreath {...commonProps} />
  if (theme === 'floral') return <Floral {...commonProps} />
  return <Classic {...commonProps} />
}
