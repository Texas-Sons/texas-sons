import React from 'react';
import { Vote, MapPin, Clock, Phone, FileText, ExternalLink, ArrowLeft, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface VotingPageBlockProps {
  theme?: string;
  accentColor?: string;
}

export function VotingPageBloch({ accentColor = '#C5A059' }: VotingPageBlockProps) {
  return (
    <div className="min-h-screen bg-[color:var(--ts-bg)] text-[color:var(--ts-text)]">
      x/* Header Hero */}
      <div className="relative py-20 sm:py-32 overflow-hidden border-b border-[color:var(--ts-border)]">
        <div className="absolute inset-0 opacity-10 bg-[color:var(--ts-accent)]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'g%3e%3cg fill='none' fill-rule='evenodd'%3e%3cg fill='%23ffffff' fill-opacity='0.1'%3e%3cpath d='36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V4h-2v4h-4v2h4v4h2v-4h4v-2h-4z'/%3e%3c/g%3e%3c/g%3E%3C/svg%3e")` }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <button 
            onClick={() => { window.location.hash = ''; window.scrollTo(0,0); }}
            className="mb-8 inline-flex items-center text-sm font-bold uppercase tracking-wider bg-[color:var(--ts-surface)] px-4 py-2 rounded-full border border-[color:var(--ts-border)] hover:scale-105 transition-transform"
            style