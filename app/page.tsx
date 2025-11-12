"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, BookOpen, QrCode, Shield } from "lucide-react"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"

export default function HomePage() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold text-foreground mb-4">Secure Attendance System</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A modern PWA for seamless classroom attendance tracking with QR codes, liveness detection, and real-time
            submission monitoring
          </p>
        </header>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <Card className="bg-card border-border p-8 hover:shadow-lg transition-shadow">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <QrCode className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">QR Code Security</h3>
                <p className="text-muted-foreground">
                  Rotating QR codes with HMAC-SHA256 signatures ensure secure attendance marking. Codes refresh every 10
                  seconds to prevent unauthorized use.
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-card border-border p-8 hover:shadow-lg transition-shadow">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">Liveness Detection</h3>
                <p className="text-muted-foreground">
                  Students must capture a selfie with face detection to verify their presence. Prevents proxy attendance
                  and ensures authentic submissions.
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-card border-border p-8 hover:shadow-lg transition-shadow">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">Real-time Tracking</h3>
                <p className="text-muted-foreground">
                  Teachers see live submission updates with automatic polling. Monitor attendance as students submit
                  with verified status display.
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-card border-border p-8 hover:shadow-lg transition-shadow">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">CSV Export</h3>
                <p className="text-muted-foreground">
                  Download attendance records as CSV for integration with gradebook systems. Complete audit trail with
                  timestamps and verification status.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Teacher Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-background border-2 border-primary rounded-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="p-8">
              <div className="w-14 h-14 bg-primary/20 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">Teacher</h2>
              <p className="text-black mb-8">
                Create attendance sessions, generate secure QR codes, monitor student submissions in real-time, and
                export attendance records.
              </p>
              <div className="space-y-3 mb-8">
                <div className="flex items-center text-sm text-foreground">
                  <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                  Create sessions with 10-minute duration
                </div>
                <div className="flex items-center text-sm text-foreground">
                  <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                  Auto-rotating QR codes every 10 seconds
                </div>
                <div className="flex items-center text-sm text-foreground">
                  <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                  Live student submission tracking
                </div>
                <div className="flex items-center text-sm text-foreground">
                  <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                  Download attendance as CSV
                </div>
              </div>
              <Link href="/teacher" className="block">
                <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold">
                  Go to Teacher Dashboard
                </Button>
              </Link>
            </div>
          </Card>

          {/* Student Card */}
          <Card className="bg-gradient-to-br from-green-50 to-background border-2 border-green-600 rounded-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="p-8">
              <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <QrCode className="w-7 h-7 text-green-600" />
              </div>
              <h2 className="text-2xl text-black font-bold text-foreground mb-3">Student</h2>
              <p className="text-black mb-8">
                Scan the QR code displayed by your teacher, complete liveness verification with a selfie, and submit
                your attendance in seconds.
              </p>
              <div className="space-y-3 mb-8">
                <div className="flex items-center text-sm text-foreground">
                  <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                  Open camera and scan QR code
                </div>
                <div className="flex items-center text-sm text-foreground">
                  <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                  Take a selfie for liveness verification
                </div>
                <div className="flex items-center text-sm text-foreground">
                  <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                  Enter your student ID
                </div>
                <div className="flex items-center text-sm text-foreground">
                  <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                  Submit attendance instantly
                </div>
              </div>
              <Link href="/student" className="block">
                <Button className="w-full h-12 bg-green-600 hover:bg-green-700 text-white text-base font-semibold">
                  Go to Student Scanner
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Technical Details */}
        <Card className="bg-card border-border p-8 mb-12">
          <h3 className="text-xl font-bold text-foreground mb-4">Technical Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-foreground mb-2">Progressive Web App</h4>
              <p className="text-sm text-muted-foreground">
                Install on mobile devices for offline-capable attendance marking. Works seamlessly on iOS and Android.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">Security First</h4>
              <p className="text-sm text-muted-foreground">
                HMAC-SHA256 signatures, QR rotation, liveness detection, and duplicate prevention prevent fraud.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">Real-time Updates</h4>
              <p className="text-sm text-muted-foreground">
                Auto-polling system keeps teacher dashboard updated with submissions every 2 seconds.
              </p>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <footer className="text-center text-muted-foreground text-sm">
          <p>Secure Attendance PWA • Built with Next.js, React, and TypeScript</p>
          <p className="mt-2">For teachers and students • Install as PWA for best experience</p>
        </footer>
      </div>

      <PWAInstallPrompt />
    </main>
  )
}
