import { useEffect, useState } from 'react';
import { fetchSkills } from '../../lib/api';
import { SectionHeader } from '../SectionHeader';

interface SkillCardProps {
  name: string;
  isSelected: boolean;
  onSelect: (name: string | null) => void;
}

const SkillCard = ({ name, isSelected, onSelect }: SkillCardProps) => (
  <button
    onClick={() => onSelect(isSelected ? null : name)}
    className={[
      'group w-full text-left px-4 py-3.5 rounded-md border transition-all duration-150 block',
      isSelected
        ? 'bg-white/6 border-white/12'
        : 'bg-white/2 border-white/6 hover:bg-white/4.5 hover:border-white/10',
    ].join(' ')}
  >
    <span className="text-[13px] font-semibold text-white/80 group-hover:text-white/95 transition-colors font-mono">
      {name}
    </span>
  </button>
);

interface SkillsSectionProps {
  selectedName: string | null;
  onSelect: (name: string | null) => void;
}

export const SkillsSection = ({ selectedName, onSelect }: SkillsSectionProps) => {
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSkills()
      .then((data) => {
        setSkills(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load skills');
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <SectionHeader
        title="Skills"
        description="Reusable instruction sets that activate on keywords or slash commands to guide specialized tasks."
        actionLabel="New Skill"
        count={skills.length}
      />

      {loading && (
        <p className="text-[12px] text-white/25 font-mono px-1">Loading…</p>
      )}

      {error && (
        <p className="text-[12px] text-rose-400/60 font-mono px-1">{error}</p>
      )}

      {!loading && !error && (
        <div className="space-y-2">
          {skills.map((name) => (
            <SkillCard
              key={name}
              name={name}
              isSelected={selectedName === name}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};
