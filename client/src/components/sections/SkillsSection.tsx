import { useEffect, useState } from 'react';
import { fetchSkills } from '../../lib/api';
import { SectionHeader } from '../SectionHeader';

interface SkillCardProps {
  name: string;
}

const SkillCard = ({ name }: SkillCardProps) => (
  <button className="group w-full text-left px-4 py-3.5 rounded-md bg-white/2 border border-white/6 hover:bg-white/4.5 hover:border-white/10 transition-all duration-150 block">
    <span className="text-[13px] font-semibold text-white/80 group-hover:text-white/95 transition-colors font-mono">
      {name}
    </span>
  </button>
);

export const SkillsSection = () => {
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
            <SkillCard key={name} name={name} />
          ))}
        </div>
      )}
    </div>
  );
};
