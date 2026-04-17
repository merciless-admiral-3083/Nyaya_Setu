import React from 'react';
import Link from 'next/link';

class Footer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const currentYear = new Date().getFullYear();

    return (
      <footer className="bg-[#1A2B4A] text-white">
        {/* Main Footer Section */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-3xl">⚖️</span>
                <div>
                  <h3 className="text-xl font-bold font-georgia">NyayaSetu</h3>
                  <span className="text-sm text-[#F5B942]">न्याय सेतु</span>
                </div>
              </div>
              <p className="text-[#F4F1EB] text-sm leading-relaxed mb-4">
                AI-powered legal aid for every Indian. Understanding your legal rights
                shouldn&apos;t require a law degree or expensive lawyer.
              </p>
              <p className="text-[#E8762D] font-bold text-lg font-georgia">
                न्याय सबके लिए — Justice for All
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-[#F5B942] font-bold mb-4 font-georgia">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/" className="text-[#F4F1EB] hover:text-[#E8762D] transition-colors">
                    Home / होम
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-[#F4F1EB] hover:text-[#E8762D] transition-colors">
                    About / के बारे में
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-[#F4F1EB] hover:text-[#E8762D] transition-colors">
                    Contact / संपर्क
                  </Link>
                </li>
                <li>
                  <Link href="/app" className="text-[#F4F1EB] hover:text-[#E8762D] transition-colors">
                    Analyse Document
                  </Link>
                </li>
              </ul>
            </div>

            {/* Personas */}
            <div>
              <h4 className="text-[#F5B942] font-bold mb-4 font-georgia">AI Sabha</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <span className="mr-2">⚖️</span>
                  <span className="text-[#F4F1EB]">Vakil (वकील)</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">🧑‍🌾</span>
                  <span className="text-[#F4F1EB]">Aam Aadmi (आम आदमी)</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">🏛️</span>
                  <span className="text-[#F4F1EB]">Nyayaadheesh (न्यायाधीश)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-[#F5B942]">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-[#F4F1EB] text-sm text-center md:text-left mb-4 md:mb-0">
                © {currentYear} NyayaSetu. न्याय सबके लिए — Justice for All.
              </p>
              <div className="flex items-center space-x-4">
                <span className="text-[#F5B942] text-sm">🇮🇳 Made with pride in India</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    );
  }
}

export default Footer;