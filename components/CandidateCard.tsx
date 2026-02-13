import React from 'react';
import { Candidate } from '../types';

interface CandidateCardProps {
  candidate: Candidate;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({ candidate }) => {
  const title = candidate.jobTitle && candidate.jobTitle.trim() !== '' ? candidate.jobTitle : (candidate.sourceTitle || 'Perfil no LinkedIn');
  const locationLine = candidate.locationText
    ? `${candidate.locationText}${typeof candidate.distanceKm === 'number' ? ` • ${candidate.distanceKm.toFixed(1)} km` : ''}`
    : 'Localização não identificada no snippet';

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-4 shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-white font-semibold text-lg leading-tight">{candidate.fullName}</h3>
          <p className="text-white/80 text-sm mt-1">{title}</p>
          <p className="text-white/60 text-xs mt-2">{locationLine}</p>
        </div>

        <a
          href={candidate.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 rounded-lg text-sm font-semibold bg-blue-600/80 hover:bg-blue-600 text-white transition"
        >
          Abrir LinkedIn
        </a>
      </div>

      {candidate.sourceSnippet && (
        <div className="mt-3 text-sm text-white/75">
          <p className="font-semibold text-white/80 mb-1">Evidência (Google):</p>
          <p className="leading-relaxed">{candidate.sourceSnippet}</p>
        </div>
      )}
    </div>
  );
};
