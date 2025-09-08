import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Heart, AlertCircle } from "lucide-react"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          {/* Logo */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Heart className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-primary">Dasma ERP</h1>
          </div>

          <Card className="border-destructive/20">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-destructive/10 rounded-full">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-2xl">Gabim në Mirëfillësimin e Të Dhënave</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-4">
                {params?.error ? (
                  <p className="text-sm text-muted-foreground">Gabim: {params.error}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Ndodhi një gabim gjatë mirëfillësimit të të dhënave. Ju lutemi provoni përsëri.</p>
                )}
                <div className="pt-4 space-y-2">
                  <Button asChild className="w-full">
                    <Link href="/auth/login">Provoni Përsëri</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <Link href="/">Kthehu në Faqen Kryesore</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
