import { Link } from '@tanstack/react-router'
import { Github, Twitter, Linkedin } from 'lucide-react'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t bg-card text-muted-foreground mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2 no-underline">
              <span className="h-3 w-3 rounded-full bg-primary animate-pulse" />
              <span className="font-black uppercase tracking-widest text-primary text-lg">
                Equinox
              </span>
            </Link>
            <p className="text-sm">
              Empowering investors with real-time algorithmic intelligence and beautiful, high-performance market visualization.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="hover:text-primary transition-colors"><Github className="h-5 w-5" /></a>
              <a href="#" className="hover:text-primary transition-colors"><Linkedin className="h-5 w-5" /></a>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-primary mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/dashboard/search" className="hover:text-primary transition-colors">Screener</Link></li>
              <li><Link to="/dashboard/heatmap" className="hover:text-primary transition-colors">Market Heatmap</Link></li>
              <li><Link to="/indices" className="hover:text-primary transition-colors">Global Indices</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-primary mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/careers" className="hover:text-primary transition-colors">Careers</Link></li>
              <li><Link to="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-primary mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link to="/disclaimer" className="hover:text-primary transition-colors">Data Disclaimer</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p>&copy; {year} Equinox Technologies Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse"></span> All Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
