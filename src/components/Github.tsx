import { useEffect, useState } from "react";
import "./Github.css";

const GITHUB_USERNAME = "Gem023UI";
const GITHUB_PROFILE_URL = `https://github.com/${GITHUB_USERNAME}`;

interface ContributionDay {
  date: string;
  count: number;
  level: number; // 0-4, matches GitHub's own intensity scale
}

interface ContributionsResponse {
  total: Record<string, number>;
  contributions: ContributionDay[];
}

// Only shown if the live fetch fails (offline, rate-limited, blocked, etc.)
function buildPlaceholderContributions(): ContributionDay[] {
  const days: ContributionDay[] = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({ date: d.toISOString().slice(0, 10), count: 0, level: 0 });
  }
  return days;
}

// Pads the front of the list so the grid starts on a Sunday, like GitHub's own layout
function groupByWeek(days: ContributionDay[]): ContributionDay[][] {
  const first = days[0];
  const firstDow = first ? new Date(first.date).getDay() : 0;
  const padded: ContributionDay[] = [
    ...Array.from({ length: firstDow }, () => ({ date: "", count: 0, level: -1 })),
    ...days,
  ];

  const weeks: ContributionDay[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }
  return weeks;
}

function GithubContributions() {
  const [days, setDays] = useState<ContributionDay[]>([]);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadContributions() {
      try {
        const res = await fetch(
          `https://github-contributions-api.jogruber.de/v4/${GITHUB_USERNAME}?y=last`
        );
        if (!res.ok) throw new Error("Request failed");
        const data: ContributionsResponse = await res.json();
        if (cancelled) return;

        const contributions = data.contributions ?? [];
        const sum = contributions.reduce((acc, d) => acc + d.count, 0);

        setDays(contributions);
        setTotal(sum);
      } catch {
        if (cancelled) return;
        setDays(buildPlaceholderContributions());
        setTotal(null);
      }
    }

    loadContributions();
    return () => {
      cancelled = true;
    };
  }, []);

  const weeks = groupByWeek(days);

  return (
    <section className="github-contrib">
      <div className="github-contrib__stage">
        <div className="github-contrib__header">
          <a
            href={GITHUB_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="github-contrib__handle"
          >
            @{GITHUB_USERNAME} ↗
          </a>
        </div>

        <div className="github-contrib__grid">
          {weeks.map((week, wi) => (
            <div className="github-contrib__col" key={wi}>
              {week.map((day, di) => (
                <span className="github-contrib__cell" key={di}>
                  {day.level >= 0 && (
                    <span
                      className={`github-contrib__dot github-contrib__dot--lvl${day.level}`}
                      title={day.date ? `${day.count} contributions on ${day.date}` : undefined}
                    />
                  )}
                </span>
              ))}
            </div>
          ))}
        </div>

        <p className="github-contrib__total">
          {total !== null
            ? `${total.toLocaleString()} contributions in the last year`
            : "Contribution data unavailable right now"}
        </p>
      </div>
    </section>
  );
}

export default GithubContributions;