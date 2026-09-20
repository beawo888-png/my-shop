import { LocationCard } from "@/components/home/location-card";
import { LOCATIONS } from "@/lib/site-content";
import type { HomeCopy } from "@/lib/home-i18n";

export function LocationSection({ copy, branches }: {
  copy: HomeCopy["locations"];
  branches: HomeCopy["branches"];
}) {
  return (
    <section
      className="section section--light locations"
      id="location"
      aria-labelledby="location-title"
    >
      <div className="locations__inner">
        <header className="locations__header">
          <p className="eyebrow eyebrow--red">{copy.eyebrow}</p>
          <h2 id="location-title">{copy.title}</h2>
          <p>{copy.description}</p>

          <nav className="location-jumps" aria-label={copy.jumpAria}>
            {LOCATIONS.map((location) => (
              <a
                className="location-jump"
                href={location.mapUrl}
                key={location.id}
                target="_blank"
                rel="noreferrer"
                aria-label={`${branches[location.id].shortName} ${copy.placeAria}`}
              >
                <span aria-hidden="true" />
                {branches[location.id].shortName}
              </a>
            ))}
          </nav>
        </header>

        <ul className="location-grid">
          {LOCATIONS.map((location) => (
            <li key={location.id}>
              <LocationCard location={location} copy={branches[location.id]} labels={copy} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
