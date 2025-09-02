import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Heart, Mail } from "lucide-react"

export default function SignUpSuccessPage() {
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
            <h1 className="text-2xl font-bold text-primary">Planifikuesi i Dasmave</h1>
          </div>

          <Card className="border-primary/20">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-accent/10 rounded-full">
                  <Mail className="h-8 w-8 text-accent" />
                </div>
              </div>
              <CardTitle className="text-2xl">Kontrolloni Email-in tuaj</CardTitle>
              <CardDescription>Ju kemi dërguar një lidhje konfirmimi për të përfunduar regjistrimin</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Ju lutemi kontrolloni email-in tuaj dhe klikoni në lidhjen e konfirmimit për të aktivizuar llogarinë tuaj. Pasi të konfirmoni, 
                  mund të filloni të planifikoni dasmën tuaj të përsosur!
                </p>
                <div className="pt-4">
                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <Link href="/auth/login">Kthehu te Hyrja</Link>
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
